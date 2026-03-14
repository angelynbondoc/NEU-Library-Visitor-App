import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LibraryLog {
  id: string;
  uid: string;
  name: string;
  email: string;
  college: string;
  program: string;
  reason: string;
  timestamp: any;
  status: 'pending' | 'validated' | 'blocked';
  validatedBy?: string;
  validatedAt?: any;
}

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
}

export const exportToPDF = (
  logs: LibraryLog[], 
  users: UserProfile[], 
  dateRange: { start: string; end: string },
  filterType: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // --- COVER PAGE ---
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('NEU Library Statistics', pageWidth / 2, 60, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Period: ${filterType.toUpperCase()}`, pageWidth / 2, 75, { align: 'center' });
  doc.text(`${dateRange.start} to ${dateRange.end}`, pageWidth / 2, 82, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 95, { align: 'center' });

  // --- SUMMARY SECTION ---
  const validatedLogs = logs.filter(l => l.status === 'validated');
  const totalValidated = validatedLogs.length;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', margin, 120);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Validated Visitors: ${totalValidated}`, margin, 130);

  // College Breakdown
  const collegeCounts: Record<string, number> = {};
  validatedLogs.forEach(log => {
    collegeCounts[log.college] = (collegeCounts[log.college] || 0) + 1;
  });
  const topColleges = Object.entries(collegeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Top Colleges:', margin, 145);
  doc.setFont('helvetica', 'normal');
  topColleges.forEach(([college, count], index) => {
    const percentage = totalValidated > 0 ? ((count / totalValidated) * 100).toFixed(1) : 0;
    doc.text(`• ${college}: ${count} (${percentage}%)`, margin + 5, 155 + (index * 7));
  });

  // Reason Breakdown
  const reasonCounts: Record<string, number> = {};
  validatedLogs.forEach(log => {
    reasonCounts[log.reason] = (reasonCounts[log.reason] || 0) + 1;
  });
  const topReasons = Object.entries(reasonCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const reasonYStart = 155 + (topColleges.length * 7) + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Top Reasons for Visit:', margin, reasonYStart);
  doc.setFont('helvetica', 'normal');
  topReasons.forEach(([reason, count], index) => {
    const percentage = totalValidated > 0 ? ((count / totalValidated) * 100).toFixed(1) : 0;
    doc.text(`• ${reason}: ${count} (${percentage}%)`, margin + 5, reasonYStart + 10 + (index * 7));
  });

  // --- DETAILED TABLE PAGE ---
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Visitor Logs', margin, 20);

  const tableData = logs.map(log => [
    log.timestamp?.toDate().toLocaleString() || 'N/A',
    log.name,
    log.email,
    log.college,
    log.program,
    log.reason,
    log.status || 'pending',
    users.find(u => u.uid === log.validatedBy)?.displayName || (log.status === 'validated' ? 'Staff' : '-')
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Date', 'Name', 'Email', 'College', 'Program', 'Reason', 'Status', 'Validated By']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 35 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 15 },
      7: { cellWidth: 20 }
    },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Confidential – NEU Library', margin, pageHeight - 10);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 10, pageHeight - 10);
    }
  });

  const fileName = `NEU-Library-Stats_${dateRange.start}_${dateRange.end}.pdf`;
  doc.save(fileName);
};
