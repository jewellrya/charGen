import React from "react";
import ChevronLeftSvg from "pixelarticons/svg/chevron-left.svg";
import ChevronRightSvg from "pixelarticons/svg/chevron-right.svg";
import ChevronUpSvg from "pixelarticons/svg/chevron-up.svg";
import ChevronDownSvg from "pixelarticons/svg/chevron-down.svg";
import DiceSvg from "pixelarticons/svg/dice.svg";

type IconProps = { className?: string; size?: number | string };

const ImgIcon: React.FC<IconProps & { src: string; alt?: string }> = ({ src, className, size, alt }) => {
  const finalSize = size ?? 20;
  const isNumber = typeof finalSize === "number";
  return (
    <img
      src={src}
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : "true"}
      className={className}
      width={isNumber ? (finalSize as number) : undefined}
      height={isNumber ? (finalSize as number) : undefined}
      style={
        isNumber
          ? { display: "inline-block", verticalAlign: "middle" }
          : { width: finalSize as string, height: finalSize as string, display: "inline-block", verticalAlign: "middle" }
      }
    />
  );
};

export function ChevronLeftIcon(props: IconProps) {
  return <ImgIcon src={ChevronLeftSvg} alt="" {...props} />;
}
export function ChevronRightIcon(props: IconProps) {
  return <ImgIcon src={ChevronRightSvg} alt="" {...props} />;
}
export function ChevronUpIcon(props: IconProps) {
  return <ImgIcon src={ChevronUpSvg} alt="" {...props} />;
}
export function ChevronDownIcon(props: IconProps) {
  return <ImgIcon src={ChevronDownSvg} alt="" {...props} />;
}
export function DiceIcon(props: IconProps) {
  return <ImgIcon src={DiceSvg} alt="" {...props} />;
}

const ICON_MAP = {
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  ChevronUp: ChevronUpIcon,
  ChevronDown: ChevronDownIcon,
  Dice: DiceIcon,
} as const;

type IconName = keyof typeof ICON_MAP;

export function Icon({ icon, ...rest }: { icon: IconName } & IconProps) {
  const Comp = ICON_MAP[icon];
  return <Comp {...rest} />;
}
