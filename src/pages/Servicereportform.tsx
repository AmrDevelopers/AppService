import React, { useState, useRef, ChangeEvent } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Plus, Trash2, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import CustomerDropdown from '../components/customer-dropdown';
import axios from 'axios';
import { jsPDF } from "jspdf";
import { Checkbox } from "../components/ui/checkbox";

type Customer = {
  id: number;
  name: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
};

type Part = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

type Scale = {
  id: string;
  model: string;
  serialNumber: string;
  issue: string;
  department: string;
  parts: Part[];
  photos: string[];
};

type ServiceType = {
  amcCovered: boolean;
  underWarranty: boolean;
  chargeable: boolean;
};

export default function ServiceReport() {
  // State declarations
  const [activeTab, setActiveTab] = useState<'customer' | 'scales' | 'signatures'>('customer');
  const [reportDate] = useState(new Date().toLocaleDateString());
  const [reportNumber] = useState(`SR-${Math.floor(Math.random() * 10000)}`);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id'>>({
    name: '',
    address: '',
    contact_person: '',
    phone: '',
    email: ''
  });

  const [scales, setScales] = useState<Scale[]>([]);
  const [serviceType, setServiceType] = useState<ServiceType>({
    amcCovered: false,
    underWarranty: false,
    chargeable: false
  });
  const [customerContactPerson, setCustomerContactPerson] = useState('');

  const [engineerName, setEngineerName] = useState('');
  const [engineerSignature, setEngineerSignature] = useState<string | null>(null);
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [sealImage, setSealImage] = useState<string | null>(null);

  const engineerSigPadRef = useRef<SignatureCanvas>(null);
  const customerSigPadRef = useRef<SignatureCanvas>(null);
  const sealFileInputRef = useRef<HTMLInputElement>(null);
  const scalePhotoFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Scale handlers
  const addScale = () => {
    setScales(prev => [...prev, {
      id: Date.now().toString(),
      model: '',
      serialNumber: '',
      issue: '',
      department: '',
      parts: [],
      photos: [],
    }]);
  };

  const removeScale = (id: string) => {
    setScales(prev => prev.filter(s => s.id !== id));
    delete scalePhotoFileInputRefs.current[id];
  };

  const addPart = (scaleId: string) => {
    setScales(prev => prev.map(s => {
      if (s.id === scaleId) {
        return { ...s, parts: [...s.parts, { id: Date.now().toString(), name: '', quantity: 1, price: 0 }] };
      }
      return s;
    }));
  };

  const removePart = (scaleId: string, partId: string) => {
    setScales(prev => prev.map(s => {
      if (s.id === scaleId) {
        return { ...s, parts: s.parts.filter(p => p.id !== partId) };
      }
      return s;
    }));
  };

  // Signature handlers
  const clearEngineerSignature = () => {
    engineerSigPadRef.current?.clear();
    setEngineerSignature(null);
  };

  const saveEngineerSignature = () => {
    if (!engineerSigPadRef.current || engineerSigPadRef.current.isEmpty()) {
      alert('Please provide the engineer\'s signature');
      return;
    }
    const dataURL = engineerSigPadRef.current.getCanvas().toDataURL('image/png');
    setEngineerSignature(dataURL);
  };

  const clearCustomerSignature = () => {
    customerSigPadRef.current?.clear();
    setCustomerSignature(null);
  };

  const saveCustomerSignature = () => {
    if (!customerSigPadRef.current || customerSigPadRef.current.isEmpty()) {
      alert('Please provide the customer\'s signature');
      return;
    }
    const dataURL = customerSigPadRef.current.getCanvas().toDataURL('image/png');
    setCustomerSignature(dataURL);
  };

  // Image upload handlers
  const handleSealUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSealImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleScalePhotoUpload = (scaleId: string, e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScales(scales => scales.map(s => {
          if (s.id === scaleId) {
            return { ...s, photos: [...s.photos, reader.result as string] };
          }
          return s;
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScalePhoto = (scaleId: string, photoIdx: number) => {
    setScales(scales => scales.map(s => {
      if (s.id === scaleId) {
        const newPhotos = [...s.photos];
        newPhotos.splice(photoIdx, 1);
        return { ...s, photos: newPhotos };
      }
      return s;
    }));
  };

  const saveNewCustomer = () => {
    if (!newCustomer.name.trim()) {
      alert("Customer name is required");
      return;
    }
    const customerWithId: Customer = { ...newCustomer, id: Math.floor(Math.random() * 10000) };
    setSelectedCustomer(customerWithId);
    setNewCustomer({ name: '', address: '', contact_person: '', phone: '', email: '' });
    setIsAddingNewCustomer(false);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!selectedCustomer) {
      alert("Please select or add a customer");
      setActiveTab('customer');
      return;
    }
    if (!engineerSignature) {
      alert("Please provide the engineer's signature");
      setActiveTab('signatures');
      return;
    }
    if (!customerSignature) {
      alert("Please provide the customer's signature");
      setActiveTab('signatures');
      return;
    }

    const payload = {
      report_number: reportNumber,
      report_date: new Date().toISOString().slice(0, 10),
      customer_id: selectedCustomer.id,
      engineer_name: engineerName,
      engineer_signature: engineerSignature,
      customer_name: selectedCustomer.name,
      customer_contact_person: customerContactPerson,
      customer_signature: customerSignature,
      seal_image: sealImage,
      service_type: serviceType,
      scales: scales.map(s => ({
        model: s.model,
        serialNumber: s.serialNumber,
        issue: s.issue,
        department: s.department,
        parts: s.parts.map(p => ({
          name: p.name,
          quantity: p.quantity,
          price: p.price,
        })),
        photos: s.photos,
      }))
    };

    try {
      await axios.post('/api/service-reports', payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      alert('Service report submitted successfully!');
      generatePDF(payload);
      resetForm();
    } catch (err: any) {
      console.error('Error submitting service report:', err);
      alert(`Submission failed: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setIsAddingNewCustomer(false);
    setNewCustomer({ name: '', address: '', contact_person: '', phone: '', email: '' });
    setScales([]);
    setServiceType({
      amcCovered: false,
      underWarranty: false,
      chargeable: false
    });
    setCustomerContactPerson('');
    setEngineerName('');
    setEngineerSignature(null);
    setCustomerSignature(null);
    setSealImage(null);
    setActiveTab('customer');
  };

  const generatePDF = (data: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Centered Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Service Report", pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Customer Info Box
    doc.setLineWidth(0.5);
    const boxHeight = 24;
    doc.rect(15, y, pageWidth - 30, boxHeight);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    // Two Rows: Left and Right
    doc.text(`Customer Name: ${data.customer_name}`, 20, y + 8);
    doc.text(`Report Date: ${data.report_date}`, pageWidth / 2 + 5, y + 8);

    doc.text(`Report Number: ${data.report_number}`, 20, y + 18);
    doc.text(`Engineer Name: ${data.engineer_name}`, pageWidth / 2 + 5, y + 18);
    y += boxHeight + 10;

    // Scale Details Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Scale Details", pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Scale Box
    data.scales.forEach((scale: any) => {
      const boxHeight = 50;
      doc.setLineWidth(0.3);
      doc.rect(15, y - 5, pageWidth - 30, boxHeight);

      // Left Column: Text
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Model: ${scale.model}`, 20, y);
      doc.text(`Serial Number: ${scale.serialNumber}`, 20, y + 10);
      doc.text(`Department: ${scale.department}`, 20, y + 20);
      doc.text(`Issue: ${scale.issue}`, 20, y + 30);

      // Right Column: Photo
      if (scale.photos.length > 0) {
        const imgX = pageWidth - 50;
        const imgY = y;
        const imgW = 35;
        const imgH = 35;
        doc.setFont("helvetica", "bold");
        doc.text("Photo:", imgX, imgY - 2);
        doc.addImage(scale.photos[0], 'PNG', imgX, imgY, imgW, imgH);
      }

      y += boxHeight + 3;

      // Spare Parts Section
      doc.setFont("helvetica", "bold");
      doc.text("Spare Parts Details", 20, y);
      y += 6;

      const showPrice = scale.parts.some((p: any) => p.price > 0);

      // Table Header
      const rowHeight = 8;
      const tableHeight = scale.parts.length * rowHeight + rowHeight;

      doc.rect(15, y, pageWidth - 30, tableHeight);
      doc.setFont("helvetica", "bold");
      doc.text("Part Name", 20, y + 6);
      doc.text("Qty", 90, y + 6);
      if (showPrice) doc.text("Price", 130, y + 6);

      y += rowHeight;

      // Table Rows
      doc.setFont("helvetica", "normal");
      scale.parts.forEach((part: any) => {
        doc.text(part.name, 20, y + 6);
        doc.text(`${part.quantity}`, 90, y + 6);
        if (showPrice && part.price > 0) {
          doc.text(`$${part.price.toFixed(2)}`, 130, y + 6);
        }
        y += rowHeight;
      });

      y += 10;

      // Add new page if needed
      if (y > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        y = 20;
      }
    });

    // Bottom-aligned Signatures
    if (y < doc.internal.pageSize.getHeight() - 50) {
      y = doc.internal.pageSize.getHeight() - 50;
    } else {
      doc.addPage();
      y = doc.internal.pageSize.getHeight() - 50;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Engineer Signature:", 20, y);
    if (data.engineer_signature) {
      doc.addImage(data.engineer_signature, 'PNG', 20, y + 5, 50, 20);
    }

    doc.text("Customer Signature:", pageWidth / 2 + 10, y);
    if (data.customer_signature) {
      doc.addImage(data.customer_signature, 'PNG', pageWidth / 2 + 10, y + 5, 50, 20);
    }

    doc.save(`Service_Report_${data.report_number}.pdf`);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Service Report</h1>
          <div className="text-sm text-gray-500">
            <span>Date: {reportDate}</span>
            <span className="ml-4">Report #: {reportNumber}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => alert('Draft save feature not implemented')}>Save Draft</Button>
          <Button onClick={handleSubmit}>Submit Report</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6 space-x-4">
        {['customer', 'scales', 'signatures'].map(tab => (
          <button
            type="button"
            key={tab}
            className={`px-4 py-2 font-medium ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab(tab as typeof activeTab)}
          >
            {tab === 'customer' ? 'Customer Details' : tab === 'scales' ? 'Scales & Parts' : 'Signatures'}
          </button>
        ))}
      </div>

      {/* Customer Tab */}
      {activeTab === 'customer' && (
        <>
          {!isAddingNewCustomer ? (
            <>
              <div className="mb-6">
                <Label>Select Customer</Label>
                <CustomerDropdown 
                  selectedCustomer={selectedCustomer} 
                  onSelectCustomer={setSelectedCustomer}
                />
              </div>
              {selectedCustomer ? (
                <>
                  <Card className="mb-4">
                    <CardHeader className="flex justify-between items-center pb-2">
                      <CardTitle>Customer Information</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>Change</Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><Label>Name</Label> <p>{selectedCustomer.name}</p></div>
                      {selectedCustomer.address && (<div><Label>Address</Label> <p>{selectedCustomer.address}</p></div>)}
                      {selectedCustomer.contact_person && (<div><Label>Contact Person</Label> <p>{selectedCustomer.contact_person}</p></div>)}
                      {selectedCustomer.phone && (<div><Label>Phone</Label> <p>{selectedCustomer.phone}</p></div>)}
                      {selectedCustomer.email && (<div><Label>Email</Label> <p>{selectedCustomer.email}</p></div>)}
                    </CardContent>
                  </Card>

                  <Card className="mb-4">
                    <CardHeader>
                      <CardTitle>Service Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="amc-covered" 
                            checked={serviceType.amcCovered}
                            onCheckedChange={(checked) => setServiceType({...serviceType, amcCovered: Boolean(checked)})}
                          />
                          <Label htmlFor="amc-covered">AMC Covered</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="under-warranty" 
                            checked={serviceType.underWarranty}
                            onCheckedChange={(checked) => setServiceType({...serviceType, underWarranty: Boolean(checked)})}
                          />
                          <Label htmlFor="under-warranty">Under Warranty</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="chargeable" 
                            checked={serviceType.chargeable}
                            onCheckedChange={(checked) => setServiceType({...serviceType, chargeable: Boolean(checked)})}
                          />
                          <Label htmlFor="chargeable">Chargeable</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setIsAddingNewCustomer(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add New Customer
                </Button>
              )}
            </>
          ) : (
            <Card>
              <CardHeader><CardTitle>Add New Customer</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Name *</Label><Input required value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} /></div>
                <div><Label>Address</Label><Input value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} /></div>
                <div><Label>Contact Person</Label><Input value={newCustomer.contact_person} onChange={e => setNewCustomer({ ...newCustomer, contact_person: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} /></div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsAddingNewCustomer(false);
                  setNewCustomer({ name: '', address: '', contact_person: '', phone: '', email: '' });
                }}>Cancel</Button>
                <Button onClick={saveNewCustomer} disabled={!newCustomer.name.trim()}>Save Customer</Button>
              </CardFooter>
            </Card>
          )}
        </>
      )}

      {/* Scales Tab */}
      {activeTab === 'scales' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Scales</h2>
            <Button onClick={addScale}>
              <Plus className="mr-2 h-4 w-4" /> Add Scale
            </Button>
          </div>
          {scales.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No scales added yet</p>
          ) : (
            <div className="space-y-4">
              {scales.map((scale, idx) => (
                <Card key={scale.id}>
                  <CardHeader className="flex justify-between items-center pb-2">
                    <CardTitle>Scale #{idx + 1}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => removeScale(scale.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div><Label>Model</Label><Input value={scale.model} onChange={e => setScales(s => s.map(sc => sc.id === scale.id ? { ...sc, model: e.target.value } : sc))} /></div>
                      <div><Label>Serial Number</Label><Input value={scale.serialNumber} onChange={e => setScales(s => s.map(sc => sc.id === scale.id ? { ...sc, serialNumber: e.target.value } : sc))} /></div>
                    </div>
                    <div className="mb-4">
                      <Label>Department</Label>
                      <Input 
                        value={scale.department} 
                        onChange={e => setScales(s => s.map(sc => sc.id === scale.id ? { ...sc, department: e.target.value } : sc))} 
                        placeholder="Enter department name"
                      />
                    </div>
                    <div className="mb-4">
                      <Label>Issue Description</Label>
                      <Textarea rows={3} value={scale.issue} onChange={e => setScales(s => s.map(sc => sc.id === scale.id ? { ...sc, issue: e.target.value } : sc))} />
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Spare Parts</Label>
                      <Button variant="outline" size="sm" onClick={() => addPart(scale.id)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Part
                      </Button>
                    </div>
                    {scale.parts.length === 0 ? (
                      <p className="text-center py-4 text-gray-500 text-sm">No parts added for this scale</p>
                    ) : (
                      <div className="space-y-3">
                        {scale.parts.map(part => (
                          <div key={part.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                            <div><Label>Part Name</Label><Input value={part.name} onChange={e => setScales(s => s.map(sc => sc.id === scale.id ? { ...sc, parts: sc.parts.map(p => p.id === part.id ? { ...p, name: e.target.value } : p) } : sc))} /></div>
                            <div><Label>Quantity</Label><Input type="number" min={0} value={part.quantity} onChange={e => setScales(s => s.map(sc => sc.id === scale.id ? { ...sc, parts: sc.parts.map(p => p.id === part.id ? { ...p, quantity: parseInt(e.target.value) || 0 } : p) } : sc))} /></div>
                            <div><Label>Price (USD)</Label><Input type="number" min={0} step={0.01} value={part.price} onChange={e => setScales(s => s.map(sc => sc.id === scale.id ? { ...sc, parts: sc.parts.map(p => p.id === part.id ? { ...p, price: parseFloat(e.target.value) || 0 } : p) } : sc))} /></div>
                            <div><Button variant="ghost" size="sm" onClick={() => removePart(scale.id, part.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Photos */}
                    <div className="mt-4">
                      <Label>Photos</Label>
                      <div className="flex gap-2 flex-wrap items-center">
                        {scale.photos.map((photo, i) => (
                          <div key={i} className="relative w-16 h-16 border rounded-xl overflow-hidden">
                            <img src={photo} alt={`Scale photo ${i + 1}`} className="object-cover w-full h-full" />
                            <button
                              type="button"
                              onClick={() => removeScalePhoto(scale.id, i)}
                              className="absolute top-0 right-0 bg-white rounded-bl px-1 text-red-600 hover:bg-red-100"
                              aria-label="Remove photo"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            capture="environment"
                            style={{ display: 'none' }}
                            ref={el => (scalePhotoFileInputRefs.current[scale.id] = el)}
                            onChange={e => handleScalePhotoUpload(scale.id, e)}
                          />
                          <Button variant="outline" size="sm" onClick={() => scalePhotoFileInputRefs.current[scale.id]?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Upload Photos
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Signatures Tab */}
      {activeTab === 'signatures' && (
        <div>
          <Card className="mb-4">
            <CardHeader><CardTitle>Engineer Information</CardTitle></CardHeader>
            <CardContent>
              <Label htmlFor="engineer-name">Engineer Name</Label>
              <Input id="engineer-name" value={engineerName} onChange={e => setEngineerName(e.target.value)} />
              <Label className="mt-4">Engineer Signature</Label>
              <div className="border rounded-md mt-2">
                <SignatureCanvas
                  ref={engineerSigPadRef}
                  penColor="black"
                  canvasProps={{ width: 500, height: 150, className: 'sigCanvas' }}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={clearEngineerSignature}>Clear</Button>
                <Button variant="default" size="sm" onClick={saveEngineerSignature}>Save Signature</Button>
              </div>
              {engineerSignature && (
                <div className="mt-2">
                  <Label>Saved Signature Preview:</Label>
                  <img src={engineerSignature} alt="Engineer signature preview" className="border rounded-md max-h-24 mt-1" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer-contact">Contact Person Name</Label>
                <Input 
                  id="customer-contact" 
                  value={customerContactPerson} 
                  onChange={(e) => setCustomerContactPerson(e.target.value)} 
                  placeholder="Enter customer contact person name"
                />
              </div>
              <div>
                <Label>Customer Signature</Label>
                <div className="border rounded-md mt-2">
                  <SignatureCanvas
                    ref={customerSigPadRef}
                    penColor="black"
                    canvasProps={{ width: 500, height: 150, className: 'sigCanvas' }}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearCustomerSignature}>Clear</Button>
                  <Button variant="default" size="sm" onClick={saveCustomerSignature}>Save Signature</Button>
                </div>
                {customerSignature && (
                  <div className="mt-2">
                    <Label>Saved Signature Preview:</Label>
                    <img src={customerSignature} alt="Customer signature preview" className="border rounded-md max-h-24 mt-1" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Company Seal</CardTitle></CardHeader>
            <CardContent>
              {sealImage ? (
                <div className="flex items-center gap-4">
                  <div className="bg-gray-200 rounded-md w-16 h-16 flex items-center justify-center overflow-hidden">
                    <img src={sealImage} alt="Company seal" className="max-w-full max-h-full object-contain" />
                  </div>
                  <Button variant="outline" onClick={() => {
                    setSealImage(null);
                    if (sealFileInputRef.current) sealFileInputRef.current.value = '';
                  }}>Change</Button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    ref={sealFileInputRef}
                    onChange={handleSealUpload}
                  />
                  <Button variant="outline" onClick={() => sealFileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Company Seal
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" disabled={activeTab === 'customer'} onClick={() => {
          if (activeTab === 'scales') setActiveTab('customer');
          else if (activeTab === 'signatures') setActiveTab('scales');
        }} type="button">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {activeTab !== 'signatures' ? (
          <Button onClick={() => {
            if (activeTab === 'customer') setActiveTab('scales');
            else if (activeTab === 'scales') setActiveTab('signatures');
          }} type="button">
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit}>Submit Report</Button>
        )}
      </div>

      <style>{`
        .sigCanvas {
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 100%;
          height: 150px;
          max-width: 100%;
          touch-action: none;
        }
      `}</style>
    </div>
  );
}