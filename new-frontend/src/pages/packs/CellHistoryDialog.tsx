import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Typography } from '@mui/material';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCellHistory } from 'hooks/useCellHistory';
import { CellUpdateEvent } from 'hooks/usePackRealtime';
import { CellReadingPoint } from 'services/cells';
import ReactEchart from 'components/base/ReactEhart';
import PageLoader from 'components/loading/PageLoader';

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

interface CellHistoryDialogProps {
  packId: string;
  cellNo: number;
  // Latest snapshot from the parent's usePackRealtime — this dialog watches
  // it for changes and appends a point each time it's for this cell, rather
  // than subscribing to the socket itself (usePackRealtime already owns
  // that subscription for the whole page).
  liveEvent?: CellUpdateEvent;
  onClose: () => void;
}

const toPoint = (event: CellUpdateEvent): CellReadingPoint => ({
  timestamp: event.timestamp,
  metrics: event.metrics,
  pack_metrics: event.pack_metrics,
  state: event.state,
  alerts: event.alerts,
});

const CellHistoryDialog = ({ packId, cellNo, liveEvent, onClose }: CellHistoryDialogProps) => {
  const { data: history, isLoading, error, refetch } = useCellHistory(packId, cellNo);
  const [livePoints, setLivePoints] = useState<CellReadingPoint[]>([]);
  const lastTimestampRef = useRef<string | null>(null);

  // Reset the live buffer when switching to a different cell so stale
  // points from the previous one don't linger in the chart.
  useEffect(() => {
    setLivePoints([]);
    lastTimestampRef.current = null;
  }, [packId, cellNo]);

  useEffect(() => {
    if (!liveEvent || liveEvent.cell_id !== cellNo) return;
    if (liveEvent.timestamp === lastTimestampRef.current) return;
    lastTimestampRef.current = liveEvent.timestamp;
    // Cap the live buffer so a long-open dialog doesn't grow unbounded.
    setLivePoints((prev) => [...prev, toPoint(liveEvent)].slice(-500));
  }, [liveEvent, cellNo]);

  // Historical fetch + live buffer, stitched together at the boundary so a
  // point that arrived live isn't duplicated once a refetch would include it.
  const points = useMemo(() => {
    if (livePoints.length === 0) return history;
    const historyCutoff = history.length
      ? new Date(history[history.length - 1].timestamp).getTime()
      : 0;
    const freshLive = livePoints.filter((p) => new Date(p.timestamp).getTime() > historyCutoff);
    return [...history, ...freshLive];
  }, [history, livePoints]);

  const option = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { data: ['Voltage (V)', 'Temperature (°C)', 'SoC (%)'] },
      grid: { left: 55, right: 70, top: 45, bottom: 30 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: points.map((p) => new Date(p.timestamp).toLocaleTimeString()),
      },
      yAxis: [
        { type: 'value', name: 'V', scale: true },
        { type: 'value', name: '°C', scale: true, position: 'right' },
        { type: 'value', name: '%', min: 0, max: 100, position: 'right', offset: 55 },
      ],
      series: [
        {
          name: 'Voltage (V)',
          type: 'line',
          yAxisIndex: 0,
          showSymbol: false,
          data: points.map((p) => p.metrics.voltage),
        },
        {
          name: 'Temperature (°C)',
          type: 'line',
          yAxisIndex: 1,
          showSymbol: false,
          data: points.map((p) => p.metrics.temperature),
        },
        {
          name: 'SoC (%)',
          type: 'line',
          yAxisIndex: 2,
          showSymbol: false,
          data: points.map((p) => p.metrics.soc),
        },
      ],
    }),
    [points],
  );

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Cell {cellNo} — History</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={refetch}>Retry</Button>}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <PageLoader sx={{ height: 320 }} />
        ) : points.length === 0 ? (
          <Typography variant="body2" color="neutral.main" textAlign="center" py={6}>
            Belum ada data historis untuk cell ini dalam 1 jam terakhir. Menunggu data live masuk…
          </Typography>
        ) : (
          <Box sx={{ height: 360 }}>
            <ReactEchart
              echarts={echarts}
              option={option}
              style={{ height: '100%', width: '100%' }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CellHistoryDialog;
