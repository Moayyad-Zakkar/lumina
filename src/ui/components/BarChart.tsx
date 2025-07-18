"use client";
/*
 * Documentation:
 * Bar Chart — https://app.subframe.com/3c939b2b64b7/library?component=Bar+Chart_4d4f30e7-1869-4980-8b96-617df3b37912
 */

import React from "react";
import * as SubframeUtils from "../utils";
import * as SubframeCore from "@subframe/core";

interface BarChartRootProps
  extends React.ComponentProps<typeof SubframeCore.BarChart> {
  stacked?: boolean;
  className?: string;
}

const BarChartRoot = React.forwardRef<HTMLElement, BarChartRootProps>(
  function BarChartRoot(
    { stacked = false, className, ...otherProps }: BarChartRootProps,
    ref
  ) {
    return (
      <SubframeCore.BarChart
        className={SubframeUtils.twClassNames("h-80 w-full", className)}
        ref={ref as any}
        stacked={stacked}
        colors={[
          "#0ea5e9",
          "#bae6fd",
          "#0284c7",
          "#7dd3fc",
          "#0369a1",
          "#38bdf8",
        ]}
        {...otherProps}
      />
    );
  }
);

export const BarChart = BarChartRoot;
