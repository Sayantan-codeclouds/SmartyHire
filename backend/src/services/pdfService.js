const PDFDocument = require('pdfkit');
const Response = require('../models/Response');

const generateCandidatePDFReport = async (candidate, report, interview, company) => {
  const responses = await Response.find({ candidateId: candidate._id });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header Banner
      doc.rect(0, 0, 595.28, 90).fill('#0F172A');
      doc.fillColor('#818CF8').fontSize(22).font('Helvetica-Bold').text('SmartyHire AI', 40, 25);
      doc.fillColor('#94A3B8').fontSize(11).font('Helvetica').text('Official Candidate Assessment & Full Interview Q&A Transcript', 40, 52);

      doc.fillColor('#FFFFFF').fontSize(10).text(`Company: ${company?.name || 'Workspace'}`, 380, 28, { align: 'right' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 380, 48, { align: 'right' });

      doc.moveDown(4);

      // Candidate Profile Box
      doc.fillColor('#0F172A').fontSize(16).font('Helvetica-Bold').text(`${candidate.name}`, 40, 110);
      doc.fontSize(11).font('Helvetica').fillColor('#475569').text(`Position: ${interview.title} (${interview.jobRole})`);
      doc.fontSize(10).text(`Email: ${candidate.email} | Code: ${candidate.candidateCode} | Status: ${candidate.status}`);

      // Scorecard Summary
      doc.rect(40, 165, 515, 75).fillAndStroke('#F8FAFC', '#CBD5E1');
      doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text('OVERALL SCORECARD', 55, 178);

      doc.fillColor('#4F46E5').fontSize(28).font('Helvetica-Bold').text(`${report.overallScore}/100`, 55, 198);
      doc.fillColor(report.recommendation === 'Hire' ? '#059669' : report.recommendation === 'Maybe' ? '#D97706' : '#DC2626')
         .fontSize(16).font('Helvetica-Bold').text(`RECOMMENDATION: ${report.recommendation.toUpperCase()}`, 250, 202);

      // Skill Scores Breakdown
      doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('Competency Breakdown', 40, 260);

      const scores = report.scores || {};
      let y = 280;
      Object.entries(scores).forEach(([skill, score], i) => {
        if (i % 2 === 0 && i !== 0) y += 20;
        const x = i % 2 === 0 ? 40 : 300;
        doc.fontSize(9).font('Helvetica').fillColor('#334155').text(`${skill.toUpperCase()}: ${score}/100`, x, y);
      });

      // Executive AI Summary
      doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('Executive Groq AI Rationale', 40, y + 35);
      doc.fontSize(9).font('Helvetica').fillColor('#334155').text(report.aiSummaryExplanation || 'N/A', 40, y + 52, { width: 515 });

      // PAGE 2: FULL SET OF QUESTIONS & ANSWERS TRANSCRIPT
      doc.addPage();
      doc.rect(0, 0, 595.28, 50).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold').text('Full Interview Questions & Candidate Answers Transcript', 40, 18);

      let qY = 70;
      if (responses.length === 0) {
        doc.fontSize(10).font('Helvetica').fillColor('#64748B').text('No answer responses logged for this candidate.', 40, qY);
      } else {
        responses.forEach((res, idx) => {
          if (qY > 700) {
            doc.addPage();
            qY = 40;
          }

          doc.fillColor('#4F46E5').fontSize(11).font('Helvetica-Bold').text(`Q${idx + 1}: ${res.questionTitle || 'Interview Question'}`, 40, qY);
          qY += 16;

          if (res.questionText) {
            doc.fillColor('#334155').fontSize(9).font('Helvetica-Oblique').text(`Question: "${res.questionText}"`, 40, qY, { width: 515 });
            qY += doc.heightOfString(`Question: "${res.questionText}"`, { width: 515 }) + 6;
          }

          doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text('Candidate Answer:', 40, qY);
          qY += 14;

          const answerStr = res.answerText || 'Candidate provided spoken response.';
          doc.fillColor('#1E293B').fontSize(9).font('Helvetica').text(answerStr, 40, qY, { width: 515 });
          qY += doc.heightOfString(answerStr, { width: 515 }) + 8;

          if (res.codeSubmitted && res.codeSubmitted.trim()) {
            doc.fillColor('#0284C7').fontSize(9).font('Helvetica-Bold').text('Code Submitted:', 40, qY);
            qY += 12;
            doc.fillColor('#0F172A').fontSize(8).font('Courier').text(res.codeSubmitted, 40, qY, { width: 515 });
            qY += doc.heightOfString(res.codeSubmitted, { width: 515 }) + 8;
          }

          doc.rect(40, qY, 515, 1).fill('#E2E8F0');
          qY += 14;
        });
      }

      // Footer
      doc.fontSize(8).fillColor('#94A3B8').text('Confidential - SmartyHire AI Proctoring & Full Transcript Report', 40, 780, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateCandidatePDFReport,
};
