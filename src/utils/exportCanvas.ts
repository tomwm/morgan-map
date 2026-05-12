import { toPng, toSvg } from 'html-to-image';
import jsPDF from 'jspdf';

function getElement(): HTMLElement | null {
  return document.querySelector('.react-flow__renderer');
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = dataUrl;
  a.click();
}

const OPTIONS = {
  backgroundColor: '#f8fafc',
  // Skip external resources that might cause CORS errors
  filter: (node: HTMLElement) => {
    return !(node.tagName === 'BUTTON') && !node.classList?.contains('react-flow__controls');
  },
};

export async function exportAsPng(mapName: string): Promise<void> {
  const el = getElement();
  if (!el) return;
  const dataUrl = await toPng(el, { ...OPTIONS, pixelRatio: 2 });
  triggerDownload(dataUrl, `${mapName}.png`);
}

export async function exportAsSvg(mapName: string): Promise<void> {
  const el = getElement();
  if (!el) return;
  const dataUrl = await toSvg(el, OPTIONS);
  triggerDownload(dataUrl, `${mapName}.svg`);
}

export async function exportAsPdf(mapName: string): Promise<void> {
  const el = getElement();
  if (!el) return;
  const dataUrl = await toPng(el, { ...OPTIONS, pixelRatio: 2 });

  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve) => { img.onload = () => resolve(); });

  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const orientation = w > h ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'px', format: [w, h] });
  pdf.addImage(dataUrl, 'PNG', 0, 0, w, h);
  pdf.save(`${mapName}.pdf`);
}
