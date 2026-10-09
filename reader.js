/* Paper paths and titles are configured in papers.json. */
(async () => {
  const title = document.getElementById('paper-title');
  const message = document.getElementById('reader-message');
  const download = document.getElementById('download-paper');
  let blobUrl;
  try {
    const response = await fetch('papers.json', {cache: 'no-cache'});
    if (!response.ok) throw new Error('catalog');
    const papers = await response.json();
    const id = new URLSearchParams(location.search).get('paper');
    if (!Object.prototype.hasOwnProperty.call(papers, id)) {
      message.textContent = 'Paper not found. Choose a title from Research papers.';
      return;
    }
    const paper = papers[id];
    title.textContent = paper.title;
    document.title = paper.title + ' — Lacuna & Conscience';
    const url = new URL(paper.file, location.href);
    if (url.origin !== location.origin) throw new Error('file');
    const pdf = await fetch(url, {cache: 'no-cache'});
    if (pdf.status === 404) {
      message.textContent = 'This paper has not been published yet. Its PDF will be available here when it is ready.';
      return;
    }
    if (!pdf.ok) throw new Error('file');
    const blob = await pdf.blob();
    if (!(await blob.slice(0, 5).text()).startsWith('%PDF-')) {
      // Some static hosts serve their HTML fallback for missing files.
      if ((pdf.headers.get('content-type') || '').includes('text/html')) {
        message.textContent = 'This paper has not been published yet. Its PDF will be available here when it is ready.';
        return;
      }
      throw new Error('file');
    }
    blobUrl = URL.createObjectURL(new Blob([blob], {type: 'application/pdf'}));
    document.getElementById('pdf-frame').src = blobUrl + '#view=FitH';
    document.getElementById('pdf-frame').title = paper.title + ' — PDF';
    download.href = blobUrl;
    download.download = id + '.pdf';
    download.hidden = false;
    const fullscreen = document.getElementById('fullscreen-paper');
    const frame = document.getElementById('pdf-frame');
    fullscreen.hidden = false;
    fullscreen.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (frame.requestFullscreen) await frame.requestFullscreen();
        else if (frame.webkitEnterFullscreen) frame.webkitEnterFullscreen();
      } catch (error) {
        message.hidden = false;
        message.textContent = 'Full screen is not supported by this browser. You can still read or download the PDF here.';
      }
    });
    document.addEventListener('fullscreenchange', () => {
      fullscreen.textContent = document.fullscreenElement ? 'Exit Full Screen' : '⛶ Full Screen';
    });
    document.getElementById('pdf-container').hidden = false;
    message.hidden = true;
  } catch (error) {
    message.textContent = 'The paper could not be loaded. Please refresh the page or try again later.';
  }
})();
