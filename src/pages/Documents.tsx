import React, { useState, useRef, useEffect } from 'react';
import { useTenant } from '@/src/lib/TenantContext';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { 
  UploadCloud, File, FileText, Image as ImageIcon, Search, Filter, 
  Download, Eye, Trash2, Calendar, X, Check, Info, FileSpreadsheet
} from 'lucide-react';

export default function DocumentsPage() {
  const { selectedCompanyId } = useTenant();
  const [data, setData] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents?companyId=${selectedCompanyId ?? 1}`);
      if (res.ok) {
        const rawData = await res.json();
        const mapped = rawData.map((dbRow: any, idx: number) => ({
          id: `DOC-${(dbRow.Document_Id !== undefined && dbRow.Document_Id !== null ? dbRow.Document_Id : idx + 1).toString().padStart(3, '0')}`,
          name: dbRow.File_Name,
          type: dbRow.Document_Type === 'ClaimEvidence' ? 'PDF' : 'Image',
          size: 'Unknown',
          date: dbRow.Uploaded_Date || '-',
          uploadedBy: dbRow.Uploaded_By ? `User #${dbRow.Uploaded_By}` : 'System',
          category: dbRow.Document_Type,
          belongsTo: dbRow.Claim_Id ? 'Specific Claim' : (dbRow.Policy_Id ? 'Specific Policy' : 'General'),
          belongsToRef: dbRow.Claim_Id ? `CLM-${dbRow.Claim_Id}` : (dbRow.Policy_Id ? `POL-${dbRow.Policy_Id}` : ''),
          remarks: dbRow.Description
        }));
        setData(mapped);
      }
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Policy Contract');
  const [belongsToType, setBelongsToType] = useState('General'); // General, Specific Policy, Specific Claim, Specific Customer
  const [belongsToReference, setBelongsToReference] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [uploader, setUploader] = useState('Loading…');
  const [remarks, setRemarks] = useState('');
  useEffect(() => {
    const loadUploader = async () => {
      try {
        const res = await fetch(`/api/claim-staff?companyId=${selectedCompanyId ?? 1}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const active = data.find((s: any) => s.Status === 'Active') || data[0];
            setUploader(`${active.First_Name} ${active.Last_Name}`);
          }
        }
      } catch (e) { console.error('Uploader load failed:', e); }
    };
    loadUploader();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const selectLocalFile = (file: File) => {
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;
    let typeGuessed = 'PDF';
    const lowName = file.name.toLowerCase();
    if (lowName.endsWith('.pdf')) {
      typeGuessed = 'PDF';
    } else if (lowName.endsWith('.jpg') || lowName.endsWith('.jpeg') || lowName.endsWith('.png') || lowName.endsWith('.gif')) {
      typeGuessed = 'Image';
    } else if (lowName.endsWith('.xlsx') || lowName.endsWith('.xls') || lowName.endsWith('.csv')) {
      typeGuessed = 'Spreadsheet';
    } else if (lowName.endsWith('.doc') || lowName.endsWith('.docx') || lowName.endsWith('.txt')) {
      typeGuessed = 'Document';
    }

    setSelectedFile({
      name: file.name,
      size: sizeStr,
      type: typeGuessed
    });
    setDocTitle(file.name);
    setFileType(typeGuessed);
    if (lowName.includes('claim') || lowName.includes('police') || lowName.includes('clm')) {
      setDocCategory('Claims Evidence');
      setBelongsToType('Specific Claim');
      const claimMatch = lowName.match(/clm-\d+/i);
      setBelongsToReference(claimMatch ? claimMatch[0].toUpperCase() : 'CLM-0092');
    } else if (lowName.includes('policy') || lowName.includes('contract') || lowName.includes('pg-')) {
      setDocCategory('Policy Contract');
      setBelongsToType('Specific Policy');
      const policyMatch = lowName.match(/pg-\d+-\d+/i) || lowName.match(/pg-\d+/i);
      setBelongsToReference(policyMatch ? policyMatch[0].toUpperCase() : 'PG-2024-0001');
    } else if (lowName.includes('id') || lowName.includes('license') || lowName.includes('driver')) {
      setDocCategory('Identity Proof');
      setBelongsToType('Specific Customer');
      setBelongsToReference(uploader);
    } else if (lowName.includes('estimate') || lowName.includes('repair') || lowName.includes('garage')) {
      setDocCategory('Garage Estimate');
      setBelongsToType('Specific Claim');
      setBelongsToReference('CLM-0092');
    } else {
      setDocCategory('Administrative');
      setBelongsToType('General');
      setBelongsToReference('');
    }
    
    setRemarks(`Registering file upload for ${file.name}`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      selectLocalFile(e.dataTransfer.files[0]);
    }
  };

  const handleRegisterDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      const res = await fetch(`/api/documents?companyId=${selectedCompanyId ?? 1}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Document_Type: fileType,
          File_Path: `/docs/${docTitle || selectedFile.name}`
        })
      });
      if (res.ok) await fetchDocuments();
    } catch (err) { console.error(err); }

    setSelectedFile(null);
    setRemarks('');
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to permanently delete this document record from the vault?")) {
      try {
        const res = await fetch(`/api/documents/${parseInt(id.replace('DOC-',''), 10)}?companyId=${selectedCompanyId ?? 1}`, { method: 'DELETE' });
        if (res.ok) await fetchDocuments();
      } catch (err) { console.error(err); }
      if (viewingDoc?.id === id) {
        setViewingDoc(null);
      }
    }
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'PDF': return <FileText className="w-5 h-5 text-red-500" />;
      case 'Image': return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'Spreadsheet': return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };
  const filteredData = data.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.belongsToRef && item.belongsToRef.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Documents Registry</h1>
          <p className="text-sm text-gray-500 mt-1">Audit, register, and trace files registered in your storage vaults</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload & Form Zone */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-gray-200 h-full flex flex-col bg-white">
            <CardContent className="p-5 flex-1 flex flex-col">
              
              {!selectedFile ? (
                <div className="flex-1 flex flex-col">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Click / Drop Upload Zone</h3>
                  
                  <div 
                    className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center transition-all min-h-[350px] ${
                      isDragging ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 border border-blue-200">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Click or drag file to start</p>
                    <p className="text-[11px] text-gray-500 mb-6 max-w-[200px] leading-relaxed">
                      Files will drop into the staging container to catalog metadata, file types, and reference linkages.
                    </p>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          selectLocalFile(e.target.files[0]);
                        }
                      }} 
                    />
                    
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select File
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterDocumentSubmit} className="flex-1 flex flex-col space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b">
                    <h3 className="text-xs font-bold text-gray-950 uppercase tracking-widest flex items-center gap-1 text-blue-600">
                      <FileText className="w-4 h-4 animate-bounce" /> Catalog File Upload
                    </h3>
                    <button 
                      onClick={() => setSelectedFile(null)} 
                      type="button" 
                      className="text-red-500 hover:underline font-bold text-[10px]"
                    >
                      Cancel / Reset
                    </button>
                  </div>

                  {/* Staged File Badge Board */}
                  <div className="bg-slate-50 p-3 rounded-lg border flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                      {getFileIcon(fileType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono font-black uppercase mt-0.5">{selectedFile.size} Staged Payload</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Document Display Title *</label>
                    <Input 
                      type="text" 
                      required 
                      value={docTitle} 
                      onChange={e => setDocTitle(e.target.value)} 
                      className="h-10 text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Classification Type *</label>
                      <select 
                        value={docCategory} 
                        onChange={e => setDocCategory(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 h-10 px-2 rounded-lg text-xs font-bold text-gray-800"
                      >
                        <option value="Policy Contract">Policy Contract</option>
                        <option value="Identity Proof">Identity Proof</option>
                        <option value="Claims Evidence">Claims Evidence</option>
                        <option value="Garage Estimate">Garage Estimate</option>
                        <option value="Vehicle Logbook">Vehicle Logbook</option>
                        <option value="Administrative">Administrative</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">File Format</label>
                      <select 
                        value={fileType} 
                        onChange={e => setFileType(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 h-10 px-2 rounded-lg text-xs font-bold text-gray-800"
                      >
                        <option value="PDF">PDF Document</option>
                        <option value="Image">JPEG/PNG Image</option>
                        <option value="Spreadsheet">Excel Worksheet</option>
                        <option value="Document">Word Document</option>
                      </select>
                    </div>
                  </div>

                  {/* What it Belongs To Segment Panel */}
                  <div className="bg-blue-50/20 p-3 rounded-lg border border-dashed border-blue-200 space-y-3">
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-blue-600">Enterprise Association Metadata</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-blue-600 font-bold uppercase tracking-wider text-[9px]">Belongs To Target *</label>
                        <select 
                          value={belongsToType} 
                          onChange={e => {
                            setBelongsToType(e.target.value);
                            if (e.target.value === 'General') setBelongsToReference('');
                          }}
                          className="w-full bg-white border border-blue-200 h-9 px-2 rounded-lg text-xs font-bold text-blue-900"
                        >
                          <option value="General">System-wide / General</option>
                          <option value="Specific Policy">Specific Policy</option>
                          <option value="Specific Claim">Specific Claim</option>
                          <option value="Specific Customer">Specific Customer</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-blue-600 font-bold uppercase tracking-wider text-[9px]">Ref ID / Object Key</label>
                        <Input 
                          type="text" 
                          placeholder={
                            belongsToType === 'Specific Policy' ? 'e.g. PG-2024-0001' :
                            belongsToType === 'Specific Claim' ? 'e.g. CLM-0092' :
                            belongsToType === 'Specific Customer' ? 'e.g. Mulualem Tesfaye' : 'Not Applicable'
                          }
                          disabled={belongsToType === 'General'}
                          required={belongsToType !== 'General'}
                          value={belongsToReference} 
                          onChange={e => setBelongsToReference(e.target.value)} 
                          className="h-9 text-xs font-semibold bg-white border-blue-200 text-blue-900 placeholder:text-blue-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Uploader / Owner Name</label>
                    <Input 
                      type="text" 
                      value={uploader} 
                      onChange={e => setUploader(e.target.value)} 
                      className="h-10 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">Remarks & File Description</label>
                    <textarea 
                      rows={2} 
                      placeholder="Specify file contextual info or security level remarks..." 
                      value={remarks} 
                      onChange={e => setRemarks(e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white text-gray-800 text-xs border border-gray-200 p-2.5 rounded-lg font-medium"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2.5 mt-auto flex items-center justify-center gap-1.5 shadow">
                    <Check className="w-4 h-4" /> Save & Register Document
                  </Button>
                </form>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Document List */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm h-full flex flex-col border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search name, category, or ref..." 
                  className="pl-9 bg-gray-50/50 border-gray-200 h-10 text-sm focus:bg-white" 
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 whitespace-nowrap overflow-x-auto">
                <div className="flex items-center p-1 bg-gray-50 border border-gray-200 rounded-lg whitespace-nowrap overflow-x-auto">
                  {['All', 'Policy Contract', 'Claims Evidence', 'Identity Proof'].map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded transition-colors ${
                        activeCategory === cat 
                          ? 'bg-white text-gray-900 shadow-sm border' 
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                  className="text-gray-500 border-gray-200 text-[10px] font-bold"
                >
                  Reset
                </Button>
              </div>
            </div>

            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-55/65">
                    <TableRow className="hover:bg-transparent border-b-gray-100">
                      <TableHead className="py-3.5 font-semibold text-gray-500 pl-6 w-[280px]">FILE DETAILS</TableHead>
                      <TableHead className="py-3.5 font-semibold text-gray-500">CATEGORY & BELONGS TO</TableHead>
                      <TableHead className="py-3.5 font-semibold text-gray-500">DATE REGISTERED</TableHead>
                      <TableHead className="py-3.5 font-semibold text-gray-500">SIZE</TableHead>
                      <TableHead className="py-3.5 font-semibold text-gray-500 text-right pr-6">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((doc) => (
                      <TableRow key={doc.id} className="border-b-gray-50 hover:bg-slate-50/55 cursor-pointer group" onClick={() => setViewingDoc(doc)}>
                        <TableCell className="py-3.5 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded bg-gray-50 border flex items-center justify-center shrink-0">
                              {getFileIcon(doc.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate" title={doc.name}>{doc.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold mt-0.5">ID: <span className="font-mono text-blue-600">{doc.id}</span> • By: {doc.uploadedBy}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5">
                           <div className="flex flex-col gap-0.5">
                             <Badge variant="outline" className="w-fit bg-slate-50 text-slate-700 border-slate-200 font-extrabold text-[9px] uppercase tracking-wider py-0 px-2 leading-none">
                               {doc.category}
                             </Badge>
                             {doc.belongsTo && doc.belongsTo !== 'General' && (
                               <span className="text-[10px] text-blue-600 font-extrabold font-mono uppercase tracking-tight">
                                 {doc.belongsToRef} • Link
                               </span>
                             )}
                           </div>
                        </TableCell>
                        <TableCell className="py-3.5 text-xs font-medium text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {doc.date}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 text-xs font-bold text-gray-750">
                          {doc.size}
                        </TableCell>
                        <TableCell className="py-3.5 text-right pr-6" onClick={e => e.stopPropagation()}>
                           <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" onClick={() => setViewingDoc(doc)} className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Preview Document">
                               <Eye className="w-4 h-4" />
                             </Button>
                              <Button variant="ghost" size="icon" onClick={() => console.info(`Simulating payload download for file ${doc.name} (${doc.size}). Check your downloads.`) } className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50">
                               <Download className="w-4 h-4" />
                             </Button>
                             <Button variant="ghost" size="icon" onClick={(e) => handleDeleteDoc(doc.id, e)} className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50">
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-gray-400 font-medium">
                          No registered files match your filters. Try dropping one to stage!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Document Detail Preview Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200 border border-gray-100">
            <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-gray-905 text-xs flex items-center gap-2">
                {getFileIcon(viewingDoc.type)}
                {viewingDoc.name}
              </span>
              <button onClick={() => setViewingDoc(null)} className="text-gray-400 hover:text-gray-650">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5 text-xs">
              <div className="border border-dashed border-gray-200 rounded-lg p-8 bg-slate-50 flex flex-col justify-center items-center text-center">
                {getFileIcon(viewingDoc.type)}
                <p className="text-xs font-bold text-gray-800 mt-2.5">Secure Storage Vault Asset</p>
                <p className="text-[11px] text-gray-500 mt-1 max-w-sm leading-relaxed">{viewingDoc.name} ({viewingDoc.size}) is cleared in secure administrative vault memory. Key checksum holds normal status.</p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wider text-[8px]">Registry ID</span>
                  <span className="font-mono font-bold text-blue-600">{viewingDoc.id}</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wider text-[8px]">Classification Category</span>
                  <span className="font-bold text-gray-800 uppercase text-[10px]">{viewingDoc.category}</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wider text-[8px]">Registered Date</span>
                  <span className="font-bold text-gray-700">{viewingDoc.date}</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wider text-[8px]">Owner/Uploader</span>
                  <span className="font-bold text-gray-700">{viewingDoc.uploadedBy}</span>
                </div>
              </div>

              {/* Entity Association Dashboard in Modal */}
              <div className="bg-blue-50/40 p-3 rounded-lg border border-dashed border-blue-200">
                <div className="flex justify-between items-center text-[8px] text-blue-800 font-bold tracking-widest uppercase">
                  <span>Vault Association Linkage</span>
                  <span className="text-blue-600 font-black">ACTIVE LINK</span>
                </div>
                <div className="mt-2 text-xs font-bold text-gray-850 flex items-center justify-between">
                  <span>Assigned Scope: {viewingDoc.belongsTo || 'System-wide / General'}</span>
                  {viewingDoc.belongsToRef && (
                    <span className="bg-blue-600 text-white font-mono px-2 py-0.5 rounded text-[10px]">
                      {viewingDoc.belongsToRef}
                    </span>
                  )}
                </div>
              </div>

              {/* Remarks/Description in Modal */}
              <div className="space-y-1">
                <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">File Remarks & Description</span>
                <div className="bg-slate-50 p-2.5 rounded border text-gray-700 leading-relaxed font-semibold">
                  {viewingDoc.remarks || 'No detailed annotations provided for this file.'}
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs">
                <button 
                  onClick={(e) => {
                    if (confirm(`Are you sure you want to void and delete ${viewingDoc.id}?`)) {
                      setData(data.filter(d => d.id !== viewingDoc.id));
                      setViewingDoc(null);
                    }
                  }} 
                  className="text-red-500 font-bold hover:underline"
                >
                  Void File Record
                </button>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-gray-700" onClick={() => setViewingDoc(null)}>Close Preview</Button>
                   <Button size="sm" onClick={() => console.info(`Downloading ${viewingDoc.name}`)} className="bg-blue-600 text-white hover:bg-blue-700 font-black flex items-center gap-1.5 shadow">
                    <Download className="w-3.5 h-3.5" /> Download file ({viewingDoc.size})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
