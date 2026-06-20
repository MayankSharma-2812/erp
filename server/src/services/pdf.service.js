const fs = require('fs');
const path = require('path');

const generatePdfFromHtml = async (htmlContent, outputPath) => {
  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });

  // Inject branding watermark
  const watermarkHtml = `
    <div class="rankschool-watermark" style="position: fixed; bottom: 8px; right: 8px; font-size: 8px; color: rgba(156, 163, 175, 0.6); font-family: 'Inter', -apple-system, sans-serif; pointer-events: none; z-index: 9999; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
      designed and created by RankSchool Digital
    </div>
  `;
  let processedHtml = htmlContent;
  if (htmlContent.includes('</body>')) {
    processedHtml = htmlContent.replace('</body>', `${watermarkHtml}</body>`);
  } else {
    processedHtml = htmlContent + watermarkHtml;
  }

  try {
    if (process.env.DISABLE_PUPPETEER === 'true') {
      throw new Error('Puppeteer is disabled via env variable.');
    }
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(processedHtml, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
      },
      printBackground: true,
    });

    await browser.close();
    console.log(`✅ PDF successfully generated at: ${outputPath}`);
    return true;
  } catch (error) {
    console.warn('⚠️ Puppeteer PDF generation failed. Falling back to writing raw HTML file.', error.message);
    
    // Fallback: Write HTML file directly, so the user can still open/view/print it
    const htmlPath = outputPath.replace(/\.pdf$/, '.html');
    fs.writeFileSync(htmlPath, processedHtml);
    console.log(`✅ Fallback HTML written to: ${htmlPath}`);
    return false;
  }
};

module.exports = {
  generatePdfFromHtml,
};
