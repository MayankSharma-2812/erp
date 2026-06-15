const fs = require('fs');
const path = require('path');

const generatePdfFromHtml = async (htmlContent, outputPath) => {
  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });

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
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
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
    fs.writeFileSync(htmlPath, htmlContent);
    
    // Also write a dummy PDF file so references don't crash
    fs.writeFileSync(outputPath, 'Dummy PDF file (Puppeteer was not fully loaded or network blocked). Please view the sibling .html file.');
    console.log(`✅ Fallback HTML written to: ${htmlPath}`);
    return false;
  }
};

module.exports = {
  generatePdfFromHtml,
};
