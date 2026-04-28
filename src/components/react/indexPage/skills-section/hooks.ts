import { useEffect, useState, type CSSProperties } from "react";

export function useSyncSize() {
  // we allowed to fill 50 percent of page for content (changed base on page size)
  const contentHeightShare = 50;
  //sphere is 5 percent smaller than allowed height
  const sphereGapPercent = 5;
  const variableStyle: CSSProperties = { "--chs": contentHeightShare, "--chsp": contentHeightShare / 100, "--sgp": sphereGapPercent } as CSSProperties
  return { contentHeightShare, sphereGapPercent, variableStyle }
}

export function useHalfCirclePath() {
  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  function describeArc(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {

    var start = polarToCartesian(centerX, centerY, radius, endAngle);
    var end = polarToCartesian(centerX, centerY, radius, startAngle);

    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    var d = [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");

    return d;
  }
  const [path] = useState(describeArc(60, 60, 60, 0, 180))
  return path;
}

export function getXYByAngle(angle:number) {
  const centerX = 60;
  const centerY = 60;
  const r = 60;
  const radian = angle * (Math.PI / 180);
  const x = centerX + Math.cos(radian) * r;
  const y = centerY + Math.sin(radian) * r;
  return {x,y}
}
export function useBulletPoints(){
  const [points] = useState({
    ui:getXYByAngle(-60),
    backend:getXYByAngle(-30),
    frontend:getXYByAngle(0),
    agile:getXYByAngle(30),
    product:getXYByAngle(60),
  });
  return points;
}