'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  UploadCloud,
  FileImage,
  Eye,
  AlertCircle,
  X,
  CheckCircle2,
  Users,
  Loader2,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { getPatients, registerPatient } from '@/lib/api/patients';
import { createScreening } from '@/lib/api/screening';
import { Patient } from '@/lib/api/types';

export default function NewScreeningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || '');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Quick inline registration state if patient not yet registered
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickRegistering, setQuickRegistering] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientGender, setNewPatientGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [newDiabetesYears, setNewDiabetesYears] = useState('');

  // Eye selection
  const [eye, setEye] = useState<'left' | 'right'>('right');

  // Image Upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Submission loading state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadPatientsList() {
      try {
        const list = await getPatients();
        setPatients(list);
        if (preselectedPatientId) {
          const match = list.find((p) => p.id === preselectedPatientId || p.patientId === preselectedPatientId);
          if (match) setSelectedPatient(match);
        } else if (list.length > 0) {
          setSelectedPatientId(list[0].id);
          setSelectedPatient(list[0]);
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      }
    }
    loadPatientsList();
  }, [preselectedPatientId]);

  const handlePatientSelect = (id: string) => {
    setSelectedPatientId(id);
    const match = patients.find((p) => p.id === id || p.patientId === id);
    setSelectedPatient(match || null);
  };

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newPatientAge || !newDiabetesYears) return;

    setQuickRegistering(true);
    try {
      const created = await registerPatient({
        patientId: `PAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        name: newPatientName,
        age: parseInt(newPatientAge, 10),
        gender: newPatientGender,
        diabetesDurationYears: parseInt(newDiabetesYears, 10),
      });
      setPatients((prev) => [created, ...prev]);
      setSelectedPatientId(created.id);
      setSelectedPatient(created);
      setShowQuickRegister(false);
    } catch (err) {
      console.error('Failed to quick-register patient:', err);
    } finally {
      setQuickRegistering(false);
    }
  };

  // Image validation and handling
  const handleFileChange = (file: File | null) => {
    setFileError(null);
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setFileError('Invalid file format. Please upload a JPG, JPEG, or PNG fundus image.');
      return;
    }

    const maxSizeMb = 10;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setFileError(`File size exceeds ${maxSizeMb}MB limits. Please upload a smaller image.`);
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedPatientId) {
      setFileError('Please select or register a patient first.');
      return;
    }

    if (!imagePreview) {
      setFileError('Please upload or select a retinal fundus image before starting screening.');
      return;
    }

    setAnalyzing(true);
    setAnalysisStep('Uploading retinal image to screening server...');

    try {
      await new Promise((r) => setTimeout(r, 800));
      setAnalysisStep('Checking image quality (blur, contrast, illumination)...');
      
      await new Promise((r) => setTimeout(r, 900));
      setAnalysisStep('Running EfficientNet DR screening & Grad-CAM analysis...');
      
      await new Promise((r) => setTimeout(r, 1000));

      const result = await createScreening(
        selectedPatientId,
        eye,
        imagePreview
      );

      router.push(`/dashboard/screening/${result.screeningId}`);
    } catch (err) {
      console.error('Screening failed:', err);
      setFileError('Failed to complete AI screening. Please try again.');
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">
            <Eye className="w-4 h-4 text-teal-600" />
            <span>Primary Health Centre Workflow</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            New Diabetic Retinopathy Screening
          </h1>
        </div>

        <Link
          href="/dashboard"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg w-fit"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* Analysis Overlay Progress Modal */}
      {analyzing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 border border-slate-200">
            <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Processing Retinal Screening</h3>
              <p className="text-xs text-slate-500 font-medium">{analysisStep}</p>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-teal-600 h-full animate-pulse rounded-full w-3/4" />
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2 text-left">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Automated image quality validation & EfficientNet Grad-CAM neural network evaluation in progress.</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Selection & Eye Selector */}
        <div className="space-y-6">
          {/* Patient Card / Selector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Patient Context</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowQuickRegister(!showQuickRegister)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all hover:brightness-105"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{showQuickRegister ? 'Select Existing' : '+ Register New Patient'}</span>
              </button>
            </div>

            {!showQuickRegister ? (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-700">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => handlePatientSelect(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patientId}) - Age {p.age}
                    </option>
                  ))}
                </select>

                {selectedPatient && (
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Patient ID:</span>
                      <span className="font-mono font-semibold text-slate-900">{selectedPatient.patientId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Age / Gender:</span>
                      <span className="font-medium text-slate-900">{selectedPatient.age} yrs &bull; {selectedPatient.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Diabetes History:</span>
                      <span className="font-semibold text-teal-700">{selectedPatient.diabetesDurationYears} Years</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleQuickRegister} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Savitri Devi"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 58"
                      value={newPatientAge}
                      onChange={(e) => setNewPatientAge(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Gender</label>
                    <select
                      value={newPatientGender}
                      onChange={(e) => setNewPatientGender(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Diabetes Duration (Years)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 8"
                    value={newDiabetesYears}
                    onChange={(e) => setNewDiabetesYears(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={quickRegistering}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {quickRegistering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save & Select Patient</span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Eye Selection Toggle */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-600" />
              <span>Select Eye Examined</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEye('left')}
                className={`py-3 px-4 rounded-xl border text-center font-bold text-xs transition-all ${
                  eye === 'left'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Left Eye (OS)
              </button>
              <button
                type="button"
                onClick={() => setEye('right')}
                className={`py-3 px-4 rounded-xl border text-center font-bold text-xs transition-all ${
                  eye === 'right'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Right Eye (OD)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Retinal Fundus Image Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileImage className="w-4 h-4 text-teal-600" />
                <span>Retinal Fundus Image Upload</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Supports JPG, JPEG, PNG (Max 10MB)
              </span>
            </div>

            {fileError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Always-mounted file input so "Change Image" works once a preview exists */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
              className="hidden"
            />

            {!imagePreview ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-teal-500 hover:bg-slate-50'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Drag and drop retinal fundus image here
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  or click to select file from your computer / connected PHC store.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 max-h-96 flex items-center justify-center p-2">
                  <img
                    src={imagePreview}
                    alt="Fundus Preview"
                    className="max-h-88 object-contain rounded-xl"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors shadow-lg"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{imageFile?.name || 'fundus_retinal_scan.png'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span>File Ready: <strong className="text-slate-900">{imageFile?.name || 'Selected Fundus Scan'}</strong></span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-teal-700 font-semibold hover:underline"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              disabled={!selectedPatientId || !imagePreview || analyzing}
              onClick={handleAnalyze}
              className={`w-full py-4 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                !selectedPatientId || !imagePreview || analyzing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
              }`}
            >
              <span>Analyze Retinal Image with EfficientNet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
