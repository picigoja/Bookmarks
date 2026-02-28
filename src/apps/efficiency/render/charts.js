export class ChartsRenderer {
  constructor(dom) {
    this.dom = dom;
    this.instances = {};
  }

  destroyAll() {
    Object.values(this.instances).forEach((chart) => chart?.destroy());
    this.instances = {};
  }

  renderBarChart(domKey, config) {
    const canvas = this.dom[domKey];
    if (!canvas) return;

    if (this.instances[domKey]) {
      this.instances[domKey].destroy();
      this.instances[domKey] = null;
    }

    const hasData = config.labels.length && config.datasets.some((d) => d.data.some((v) => typeof v === "number"));
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!hasData) {
      ctx.save();
      ctx.fillStyle = "#666";
      ctx.font = "14px Segoe UI";
      ctx.fillText("No eligible data", 20, 30);
      ctx.restore();
      return;
    }

    this.instances[domKey] = new window.Chart(ctx, {
      type: "bar",
      data: { labels: config.labels, datasets: config.datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: config.yAsPct ? { callback: (v) => `${(v * 100).toFixed(0)}%` } : {},
          },
        },
      },
    });
  }

  render(payload) {
    const topDebug = payload.debuggerSummary.slice(0, payload.opts.topN);
    this.renderBarChart("chartDebugSpeed", {
      labels: topDebug.map((x) => x.debuggerId),
      datasets: [
        { label: "Median debug min", data: topDebug.map((x) => x.medianDebugMin), backgroundColor: "rgba(54, 162, 235, 0.65)" },
        { label: "P90 debug min", data: topDebug.map((x) => x.p90DebugMin), backgroundColor: "rgba(255, 99, 132, 0.65)" },
      ],
    });

    const topRepair = payload.repairSummary.slice(0, payload.opts.topN);
    this.renderBarChart("chartRepairSpeed", {
      labels: topRepair.map((x) => x.repairUser),
      datasets: [
        { label: "Median repair min", data: topRepair.map((x) => x.medianRepairPhaseMin), backgroundColor: "rgba(75, 192, 192, 0.65)" },
        { label: "P90 repair min", data: topRepair.map((x) => x.p90RepairPhaseMin), backgroundColor: "rgba(255, 206, 86, 0.65)" },
      ],
    });

    this.renderBarChart("chartTechQuality", {
      labels: topRepair.map((x) => x.repairUser),
      datasets: [{ label: "Same-error repeat rate", data: topRepair.map((x) => x.sameErrRecAll), backgroundColor: "rgba(153, 102, 255, 0.65)" }],
      yAsPct: true,
    });

    this.renderBarChart("chartTopErrors", {
      labels: payload.topErrorVolume.map((x) => x.errorCode),
      datasets: [{ label: "Event count", data: payload.topErrorVolume.map((x) => x.nEvents), backgroundColor: "rgba(255, 159, 64, 0.7)" }],
    });

    this.renderBarChart("chartTopRework", {
      labels: payload.topRework.map((x) => x.errorCode),
      datasets: [{ label: "Same-error repeat count", data: payload.topRework.map((x) => x.sameErrRepeatCount), backgroundColor: "rgba(255, 99, 132, 0.7)" }],
    });
  }
}
