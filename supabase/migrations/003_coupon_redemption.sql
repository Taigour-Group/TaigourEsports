CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{2,49}$'),
  description text,
  reward_type text NOT NULL CHECK (reward_type IN ('tgc', 'membership')),
  reward_amount numeric CHECK (reward_amount IS NULL OR reward_amount > 0),
  membership_tier text,
  duration_days integer CHECK (duration_days IS NULL OR duration_days BETWEEN 1 AND 3650),
  max_redemptions integer CHECK (max_redemptions IS NULL OR max_redemptions > 0),
  redemption_count integer NOT NULL DEFAULT 0 CHECK (redemption_count >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (starts_at IS NULL OR expires_at IS NULL OR expires_at > starts_at),
  CHECK (
    (reward_type = 'tgc' AND reward_amount IS NOT NULL AND membership_tier IS NULL AND duration_days IS NULL)
    OR
    (reward_type = 'membership' AND reward_amount IS NULL AND membership_tier IS NOT NULL AND duration_days IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  reward_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id)
);

CREATE INDEX IF NOT EXISTS coupon_redemptions_user_created_idx
  ON public.coupon_redemptions (user_id, created_at DESC);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.coupons, public.coupon_redemptions FROM anon, authenticated;
GRANT ALL ON public.coupons, public.coupon_redemptions TO service_role;

CREATE OR REPLACE FUNCTION public.redeem_coupon(p_user_id uuid, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_player_id public.profiles.player_id%TYPE;
  v_redemption_id uuid := gen_random_uuid();
  v_reward jsonb;
BEGIN
  SELECT *
    INTO v_coupon
    FROM public.coupons
   WHERE code = upper(trim(p_code))
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'coupon_not_found';
  END IF;

  IF NOT v_coupon.is_active
     OR (v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > now())
     OR (v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= now())
     OR (v_coupon.max_redemptions IS NOT NULL AND v_coupon.redemption_count >= v_coupon.max_redemptions) THEN
    RAISE EXCEPTION 'coupon_unavailable';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.coupon_redemptions
     WHERE coupon_id = v_coupon.id
       AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'coupon_already_redeemed';
  END IF;

  SELECT player_id
    INTO v_player_id
    FROM public.profiles
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'player_profile_missing';
  END IF;

  v_reward := jsonb_build_object(
    'type', v_coupon.reward_type,
    'amount', v_coupon.reward_amount,
    'membership_tier', v_coupon.membership_tier,
    'duration_days', v_coupon.duration_days
  );

  INSERT INTO public.coupon_redemptions (id, coupon_id, user_id, reward_snapshot)
  VALUES (v_redemption_id, v_coupon.id, p_user_id, v_reward);

  UPDATE public.coupons
     SET redemption_count = redemption_count + 1
   WHERE id = v_coupon.id;

  IF v_coupon.reward_type = 'tgc' THEN
    IF v_player_id IS NULL THEN
      RAISE EXCEPTION 'player_profile_missing';
    END IF;

    PERFORM public.ensure_wallet(v_player_id, p_user_id);
    PERFORM public.wallet_recharge(
      p_wallet_id := v_player_id,
      p_amount := v_coupon.reward_amount,
      p_idempotency_key := 'coupon:' || v_redemption_id::text,
      p_reference_id := v_redemption_id::text,
      p_description := 'Coupon reward: ' || v_coupon.code,
      p_actor_user_id := p_user_id
    );
  ELSE
    PERFORM public.ensure_membership(p_user_id);
    PERFORM public.admin_set_membership(
      p_user_id := p_user_id,
      p_membership_tier := v_coupon.membership_tier,
      p_duration_days := v_coupon.duration_days
    );
  END IF;

  RETURN jsonb_build_object(
    'redemption_id', v_redemption_id,
    'code', v_coupon.code,
    'description', v_coupon.description,
    'reward', v_reward
  );
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_coupon(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(uuid, text) TO service_role;
