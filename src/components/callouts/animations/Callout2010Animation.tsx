interface Callout2010AnimationProps {
  assetSrc: string;
}

export function Callout2010Animation({
  assetSrc,
}: Callout2010AnimationProps) {
  return (
    <div className="callout-animation callout-animation--2010">
      <img
        className="callout-animation__layer callout-animation__layer--base"
        src={assetSrc}
        alt=""
        aria-hidden="true"
        style={{
          mixBlendMode: 'lighten',
          width: '100%',
          height: '100%',
          objectPosition: 'center',
        }}
      />
    </div>
  );
}
