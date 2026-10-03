const TGC_COIN_IMAGE = 'https://res.cloudinary.com/dkoirxf41/image/upload/v1791024840/TGC_Coin_Emblem_i9zt71.png';

const TgcCoin = ({ className = '', size, style, ...props }) => {
  const resolvedStyle = {
    width: size,
    height: size,
    filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.45))',
    ...style,
  };

  return (
    <img
      src={TGC_COIN_IMAGE}
      alt="TGC coin"
      className={`inline-block select-none object-contain ${className}`.trim()}
      style={size ? resolvedStyle : { filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.45))', ...style }}
      {...props}
    />
  );
};

export { TGC_COIN_IMAGE };
export default TgcCoin;
