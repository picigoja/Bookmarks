export function renderHeatmap(container, matrix) {
  if (!container) return;
  if (!matrix.proposedValues.length || !matrix.repairValues.length) {
    container.textContent = "No eligible data";
    return;
  }

  let html = "<table><thead><tr><th>Proposed ↓ / Repair →</th>";
  html += matrix.repairValues.map((v) => `<th>${v}</th>`).join("");
  html += "<th>Total</th></tr></thead><tbody>";

  matrix.proposedValues.forEach((p, i) => {
    html += `<tr><th>${p}</th>`;
    matrix.repairValues.forEach((r, j) => {
      const value = matrix.grid[i][j];
      const intensity = value / matrix.maxCell;
      const bg = `color-mix(in srgb, var(--theme-color) ${Math.round(intensity * 70)}%, transparent)`;
      html += `<td class="${p === r ? "diag" : ""}" style="background:${bg}">${value}</td>`;
    });
    html += `<td><strong>${matrix.rowTotals[i]}</strong></td></tr>`;
  });

  html += `<tr><th>Total</th>${matrix.colTotals.map((t) => `<td><strong>${t}</strong></td>`).join("")}<td><strong>${matrix.rowTotals.reduce((a, b) => a + b, 0)}</strong></td></tr>`;
  html += "</tbody></table>";
  container.innerHTML = html;
}
