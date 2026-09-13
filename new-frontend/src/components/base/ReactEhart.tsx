import { Box } from '@mui/material';
import { CSSProperties } from 'react';
import { EChartsReactProps } from 'echarts-for-react';
import EChartsReactCore from 'echarts-for-react/lib/core';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { forwardRef, useEffect, useRef } from 'react';

// Deliberately just `style` (what every caller actually passes) rather
// than extending BoxProps like before — this now renders ReactEChartsCore
// directly (not via Box's `component=` polymorphism), which doesn't accept
// MUI's sx-system props (border, color as a responsive value, etc.).
export interface ReactEchartProps {
  echarts: EChartsReactProps['echarts'];
  option: EChartsReactProps['option'];
  style?: CSSProperties;
}

const ReactEchart = forwardRef<null | EChartsReactCore, ReactEchartProps>(
  ({ option, style, ...rest }, forwardedRef) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const instanceRef = useRef<EChartsReactCore | null>(null);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return undefined;
      // echarts-for-react's own resize sensor occasionally misses the
      // very first layout pass when the chart mounts inside a MUI
      // Grid/flex container whose width isn't settled yet (seen on
      // Dashboard's "Packs by State" donut at mobile widths — it stayed
      // sized to a near-zero-width first measurement until some later,
      // unrelated layout change nudged it). A ResizeObserver on the
      // actual rendered container reliably catches that first correction.
      const resizeObserver = new ResizeObserver(() => {
        instanceRef.current?.getEchartsInstance().resize();
      });
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, []);

    return (
      <Box ref={containerRef} style={style}>
        <ReactEChartsCore
          ref={(node: EChartsReactCore | null) => {
            instanceRef.current = node;
            if (typeof forwardedRef === 'function') forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
          }}
          option={{
            ...option,
            tooltip: {
              ...option.tooltip,
              confine: true,
            },
          }}
          style={{ height: '100%', width: '100%' }}
          {...rest}
        />
      </Box>
    );
  },
);

export default ReactEchart;
