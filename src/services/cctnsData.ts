export interface FIRRecord {
  firNumber: string;
  status: 'Under Investigation' | 'Closed' | 'Chargesheet Filed' | 'Case Transferred';
  policeStation: string;
  officerName: string;
  crimeType: string;
  dateReported: string;
  location: string;
  complainantName: string;
  description: string;
  phoneNumber?: string;
}

export interface CrimeStats {
  location: string;
  crimeType: string;
  count: number;
  date: string;
}

export interface ComplaintRecord {
  id: string;
  category: 'Theft' | 'Missing Person' | 'Harassment' | 'Noise Complaint' | 'Traffic' | 'Other';
  description: string;
  location: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  dateReported: string;
  contactNumber: string;
}

// Sample FIR data
const sampleFIRs: FIRRecord[] = [
  {
    firNumber: "FIR/001/2024",
    status: "Under Investigation",
    policeStation: "Guntur City Police Station",
    officerName: "SI Ramesh Kumar",
    crimeType: "Theft",
    dateReported: "2024-06-15",
    location: "Brodipet, Guntur",
    complainantName: "Rajesh Reddy",
    description: "Motorcycle theft from parking area",
    phoneNumber: "9876543210"
  },
  {
    firNumber: "FIR/002/2024",
    status: "Closed",
    policeStation: "Vijayawada Central Police Station",
    officerName: "CI Lakshmi Devi",
    crimeType: "Missing Person",
    dateReported: "2024-06-10",
    location: "Gandhi Nagar, Vijayawada",
    complainantName: "Sita Devi",
    description: "Missing teenager - case resolved",
    phoneNumber: "9876543211"
  },
  {
    firNumber: "FIR/003/2024",
    status: "Chargesheet Filed",
    policeStation: "Tirupati East Police Station",
    officerName: "SI Venkata Rao",
    crimeType: "Fraud",
    dateReported: "2024-06-08",
    location: "Renigunta, Tirupati",
    complainantName: "Krishna Murthy",
    description: "Online fraud case - accused arrested",
    phoneNumber: "9876543212"
  }
];

// Sample crime statistics
const sampleCrimeStats: CrimeStats[] = [
  { location: "Guntur", crimeType: "Theft", count: 5, date: "2024-06-18" },
  { location: "Guntur", crimeType: "Fraud", count: 2, date: "2024-06-18" },
  { location: "Vijayawada", crimeType: "Missing Person", count: 3, date: "2024-06-18" },
  { location: "Tirupati", crimeType: "Harassment", count: 1, date: "2024-06-18" }
];

let complaints: ComplaintRecord[] = [];

export class CCTNSDataService {
  static getFIRByNumber(firNumber: string): FIRRecord | null {
    return sampleFIRs.find(fir => 
      fir.firNumber.toLowerCase().includes(firNumber.toLowerCase())
    ) || null;
  }

  static verifyFIRAccess(firNumber: string, phoneNumber: string): boolean {
    const fir = this.getFIRByNumber(firNumber);
    return fir ? fir.phoneNumber === phoneNumber : false;
  }

  static getCrimeStatsByLocation(location: string, days: number = 7): CrimeStats[] {
    return sampleCrimeStats.filter(stat => 
      stat.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  static addComplaint(complaint: Omit<ComplaintRecord, 'id' | 'status' | 'dateReported'>): ComplaintRecord {
    const newComplaint: ComplaintRecord = {
      ...complaint,
      id: `COMP/AP/${Date.now()}`,
      status: 'Open',
      dateReported: new Date().toISOString().split('T')[0]
    };
    complaints.push(newComplaint);
    return newComplaint;
  }

  static getAllComplaints(): ComplaintRecord[] {
    return complaints;
  }

  static searchFIRs(query: string): FIRRecord[] {
    const searchTerm = query.toLowerCase();
    return sampleFIRs.filter(fir => 
      fir.crimeType.toLowerCase().includes(searchTerm) ||
      fir.location.toLowerCase().includes(searchTerm) ||
      fir.description.toLowerCase().includes(searchTerm) ||
      fir.firNumber.toLowerCase().includes(searchTerm)
    );
  }
}
