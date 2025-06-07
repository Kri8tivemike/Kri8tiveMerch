import { jsPDF } from 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
    previousAutoTable?: {
      finalY: number;
    };
  }
} 