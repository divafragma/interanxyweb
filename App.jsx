import React, { useState, useEffect } from 'react';
import { 
  User, Users, Brain, LogOut, ChevronRight, Eye, 
  Target, PlusCircle, Key, Trophy, MessageSquare,
  ClipboardCheck, X, Check, Info, Settings, Trash2,
  Image as ImageIcon, Type, List, CheckCircle2, Save,
  Plus, Layout, Edit3, ArrowRight, Home
} from 'lucide-react';

const App = () => {
  // --- AUTH & GLOBAL STATE ---
  const [userProfile, setUserProfile] = useState({ nama: "", role: "", matkul: "" });
  const [view, setView] = useState('login'); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [regData, setRegData] = useState({ nama: "", role: "mahasiswa", matkul: "Probabilitas", pass: "" });
  
  // --- DATABASE ---
  const [rooms, setRooms] = useState([
    {
      id: 1,
      name: "Rombel A - Teori Peluang",
      code: "PROB01",
      matkul: "Probabilitas",
      problem: "Dua dadu dilempar bersamaan. Tentukan peluang jumlah mata dadu sama dengan 8.",
      workspaceFields: [
        { id: 'f1', label: 'Ruang Sampel' },
        { id: 'f2', label: 'Kejadian' },
        { id: 'f3', label: 'Penalaran' }
      ],
      questions: [
        { id: 'q1', type: 'pg', text: 'Jumlah sampel 2 dadu?', options: ['12', '24', '36', '48'], correct: '36' },
        { id: 'q2', type: 'boolean', text: 'Peluang maksimal adalah 1?', correct: 'Benar' }
      ]
    }
  ]);
  
  const [studentsData, setStudentsData] = useState([]); 
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [factTestOpen, setFactTestOpen] = useState(false);
  const [thresholds, setThresholds] = useState({ super: 90, sangatBaik: 75 });
  const [inspectingStudent, setInspectingStudent] = useState(null);
  const [showEditorial, setShowEditorial] = useState(false);

  // --- MAHASISWA STATE ---
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [lastFocusedField, setLastFocusedField] = useState("");
  const [answers, setAnswers] = useState({});
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [groupCode, setGroupCode] = useState("");
  const [showFactTestModal, setShowFactTestModal] = useState(false);
  const [studentFactAnswers, setStudentFactAnswers] = useState([]);

  // --- LOGIC: SYNC ---
  const syncToTeacher = (updatedData = {}) => {
    const newData = {
      id: userProfile.nama,
      name: userProfile.nama,
      group: groupCode || "Tanpa Kelompok",
      answers: answers,
      factAnswers: studentFactAnswers,
      score: calculateScore(studentFactAnswers),
      status: 'active',
      ...updatedData
    };

    setStudentsData(prev => {
      const exists = prev.find(s => s.id === newData.id);
      if (exists) return prev.map(s => s.id === newData.id ? newData : s);
      return [...prev, newData];
    });
  };

  const calculateScore = (ansArray) => {
    if (!selectedRoom?.questions || selectedRoom.questions.length === 0) return 0;
    let correctCount = 0;
    ansArray.forEach((ans, idx) => {
      const q = selectedRoom.questions[idx];
      if (!q || !ans) return;
      if (ans === q.correct) correctCount++;
      if (q.type === 'foto' && ans) correctCount++; 
    });
    return Math.round((correctCount / selectedRoom.questions.length) * 100);
  };

  const handleRegister = () => {
    if(!regData.nama || !regData.pass) return;
    setUserProfile({ nama: regData.nama, role: regData.role, matkul: regData.matkul });
    setView('dashboard');
  };

  const getGroupStats = () => {
    const groups = {};
    studentsData.forEach(s => {
      if (!groups[s.group]) groups[s.group] = { total: 0, count: 0, members: [] };
      groups[s.group].total += s.score || 0;
      groups[s.group].count += 1;
      groups[s.group].members.push(s.name);
    });
    return groups;
  };

  const getPredikat = (avg) => {
    if (avg >= thresholds.super) return { label: "TIM SUPER", text: "text-purple-600" };
    if (avg >= thresholds.sangatBaik) return { label: "TIM SANGAT BAIK", text: "text-blue-600" };
    return { label: "TIM BAIK", text: "text-slate-500" };
  };

  // --- NEW COMPONENT: FACT TEST RUNNER (IMPROVED FLOW) ---
  const FactTestRunner = () => {
    const [qIdx, setQIdx] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [tempIsian, setTempIsian] = useState("");
    const questions = selectedRoom?.questions || [];
    const currentQ = questions[qIdx];

    const handleAnswer = (val) => {
      const newAns = [...studentFactAnswers];
      newAns[qIdx] = val;
      setStudentFactAnswers(newAns);
      
      // Auto-transition logic
      if (qIdx < questions.length - 1) {
        setQIdx(qIdx + 1);
        setTempIsian(""); // Reset for next isian if any
      } else {
        // Submit all
        syncToTeacher({ factAnswers: newAns, score: calculateScore(newAns) });
        setIsFinished(true);
      }
    };

    if (isFinished) {
      return (
        <div className="fixed inset-0 bg-indigo-900/95 backdrop-blur-xl z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-2">Selesai!</h3>
            <p className="text-slate-500 font-bold mb-8 leading-relaxed">Jawabanmu telah terkirim ke sistem Dosen. Kamu bisa kembali ke dashboard sekarang.</p>
            <button 
              onClick={() => {
                setShowFactTestModal(false);
                setView('dashboard');
              }} 
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
            >
              <Home size={20}/> Kembali ke Beranda
            </button>
          </div>
        </div>
      );
    }

    if (!currentQ) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[500] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Fact Test Active</span>
              <h4 className="text-xs font-black text-slate-300">SOAL {qIdx + 1} DARI {questions.length}</h4>
            </div>
            <button onClick={() => setShowFactTestModal(false)} className="p-2 text-slate-300 hover:text-red-500"><X size={20}/></button>
          </div>

          <div className="h-1.5 w-full bg-slate-100 rounded-full mb-10 overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500" 
              style={{width: `${((qIdx + 1) / questions.length) * 100}%`}}
            ></div>
          </div>

          <div className="min-h-[120px] flex items-center mb-10">
            <h3 className="text-2xl font-black leading-tight text-slate-800 tracking-tight">{currentQ.text}</h3>
          </div>

          <div className="space-y-4">
            {currentQ.type === 'pg' && currentQ.options?.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswer(opt)} 
                className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-2xl text-left font-black text-slate-600 hover:border-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all flex justify-between items-center group"
              >
                <span>{opt}</span>
                <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-indigo-600 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </button>
            ))}

            {currentQ.type === 'boolean' && (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleAnswer('Benar')} 
                  className="bg-emerald-50 text-emerald-700 border-2 border-emerald-100 py-8 rounded-3xl font-black text-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                >
                  BENAR
                </button>
                <button 
                  onClick={() => handleAnswer('Salah')} 
                  className="bg-red-50 text-red-700 border-2 border-red-100 py-8 rounded-3xl font-black text-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  SALAH
                </button>
              </div>
            )}

            {currentQ.type === 'isian' && (
              <div className="space-y-4">
                <input 
                  autoFocus
                  type="text" 
                  value={tempIsian}
                  onChange={(e) => setTempIsian(e.target.value)}
                  placeholder="Ketik jawaban kamu..." 
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-xl focus:border-indigo-500 transition-all" 
                />
                <button 
                  onClick={() => handleAnswer(tempIsian)} 
                  disabled={!tempIsian.trim()}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
                >
                  Konfirmasi Jawaban
                </button>
              </div>
            )}

            {currentQ.type === 'foto' && (
              <div className="text-center space-y-6">
                <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] py-12 px-6 flex flex-col items-center">
                  <div className="p-5 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                    <ImageIcon size={32} />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Unggah Foto Jawaban</p>
                </div>
                <button 
                  onClick={() => handleAnswer('uploaded_img.jpg')} 
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest"
                >
                  Selesai Unggah
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- LOGIN VIEW ---
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-100 animate-in zoom-in-95 duration-500">
          <div className="text-center mb-10">
            <div className="inline-block bg-indigo-600 p-5 rounded-[2rem] mb-4 shadow-xl shadow-indigo-100">
              <Brain className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">INTERANXY</h1>
            <p className="text-slate-400 mt-1 font-bold italic text-sm uppercase tracking-widest">Cognitive Tool</p>
          </div>
          
          {!isRegistering ? (
            <div className="space-y-4">
              <input type="text" placeholder="Username" className="w-full p-5 bg-slate-50 border rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold" />
              <input type="password" placeholder="Password" className="w-full p-5 bg-slate-50 border rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold" />
              <button onClick={() => { setUserProfile({nama: "Mahasiswa Tester", role: "mahasiswa"}); setView('dashboard'); }} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">MASUK SISTEM</button>
              <button onClick={() => setIsRegistering(true)} className="w-full text-slate-400 text-xs font-black py-2 hover:text-indigo-600 transition-colors">Belum punya akun? Daftar Sekarang</button>
              <div className="pt-6 border-t border-slate-50">
                <button onClick={() => { setUserProfile({nama: "Dosen Tester", role: "dosen"}); setView('dashboard'); }} className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors italic">Login as Dosen Mode</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input value={regData.nama} onChange={e => setRegData({...regData, nama: e.target.value})} type="text" placeholder="Nama Lengkap" className="w-full p-5 bg-slate-50 border rounded-2xl outline-none font-bold" />
              <input value={regData.pass} onChange={e => setRegData({...regData, pass: e.target.value})} type="password" placeholder="Password" className="w-full p-5 bg-slate-50 border rounded-2xl outline-none font-bold" />
              <select value={regData.role} onChange={e => setRegData({...regData, role: e.target.value})} className="w-full p-5 bg-slate-50 border rounded-2xl font-black appearance-none outline-none focus:border-indigo-500">
                <option value="mahasiswa">Mahasiswa</option>
                <option value="dosen">Dosen</option>
              </select>
              <button onClick={handleRegister} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-sm">BUAT AKUN</button>
              <button onClick={() => setIsRegistering(false)} className="w-full text-slate-400 text-xs font-black py-2">Sudah ada akun? Login</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <Brain className="text-indigo-600" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase">Interanxy</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signed in as</div>
            <div className="text-xs font-black text-indigo-600 uppercase">{userProfile.nama} • {userProfile.role}</div>
          </div>
          <button onClick={() => setView('login')} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all"><LogOut size={20} /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {userProfile.role === 'mahasiswa' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!currentRoom ? (
               <div className="max-w-md mx-auto mt-20 p-12 bg-white rounded-[3rem] shadow-2xl text-center border border-slate-100">
                  <div className="bg-indigo-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6"><Key className="text-indigo-600" size={28}/></div>
                  <h2 className="text-2xl font-black mb-6 tracking-tight text-slate-800">Masuk Kelas</h2>
                  <input type="text" value={roomCodeInput} onChange={e => setRoomCodeInput(e.target.value)} placeholder="KODE ROOM" className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-black tracking-widest text-2xl mb-4 focus:border-indigo-500 outline-none uppercase" />
                  <button onClick={() => {
                    const found = rooms.find(r => r.code === roomCodeInput.toUpperCase());
                    if(found) { setSelectedRoom(found); setCurrentRoom(found); setAnswers(Object.fromEntries(found.workspaceFields.map(f => [f.id, ""]))); }
                    else alert("Kode room tidak ditemukan!");
                  }} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700">MULAI BELAJAR</button>
               </div>
            ) : (
               <div className="space-y-6">
                  {view === 'dashboard' ? (
                     <div className="space-y-6">
                        <div className="bg-white p-12 rounded-[3.5rem] shadow-sm flex flex-col md:flex-row justify-between items-center border border-slate-100 gap-6">
                           <div className="text-center md:text-left">
                              <h2 className="text-4xl font-black tracking-tighter text-slate-800">{selectedRoom.matkul}</h2>
                              <p className="text-indigo-600 font-black mt-2 uppercase text-[10px] tracking-[0.2em]">{selectedRoom.name}</p>
                           </div>
                           <button onClick={() => setView('workspace')} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all">Buka Lembar Kerja</button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                           <div className={`p-10 rounded-[3rem] border-4 transition-all relative overflow-hidden ${factTestOpen ? 'bg-white border-indigo-600 ring-8 ring-indigo-50' : 'bg-slate-100 border-transparent opacity-50'}`}>
                              <div className="flex justify-between items-start">
                                <h3 className="font-black text-2xl flex items-center gap-3 text-slate-800"><Target size={28}/> Fact Test</h3>
                                {factTestOpen && <span className="animate-pulse flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 tracking-tighter uppercase"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Sesi Terbuka</span>}
                              </div>
                              <p className="text-sm font-bold text-slate-400 mt-3">{factTestOpen ? (studentFactAnswers.length > 0 ? `Terkirim (Skor bersifat privat)` : 'Sesi kuis sudah dimulai oleh Dosen!') : 'Menunggu Dosen mengaktifkan kuis.'}</p>
                              {factTestOpen && studentFactAnswers.length === 0 && (
                                 <button onClick={() => setShowFactTestModal(true)} className="mt-12 w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 group transition-all">
                                   Masuk Pengerjaan <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                                 </button>
                              )}
                              {studentFactAnswers.length > 0 && (
                                <div className="mt-12 w-full p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-center font-black text-[10px] uppercase border border-emerald-100">
                                  Kuis Selesai Dikerjakan
                                </div>
                              )}
                           </div>
                           <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm">
                              <h3 className="font-black text-2xl flex items-center gap-3 text-slate-800"><Users size={28}/> Identitas Tim</h3>
                              <p className="text-xs text-slate-400 font-bold mt-2 mb-8 uppercase tracking-widest">Kolaborasi Aktif</p>
                              <input value={groupCode} onChange={e => {setGroupCode(e.target.value.toUpperCase()); syncToTeacher({group: e.target.value.toUpperCase()});}} placeholder="NAMA KELOMPOK" className="w-full p-6 bg-slate-50 rounded-2xl font-black text-center tracking-widest outline-none border-2 border-slate-100 focus:border-indigo-600 transition-all text-xl" />
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4">
                        <div className="lg:col-span-4 space-y-4">
                           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit sticky top-24">
                              <h4 className="text-[10px] font-black text-indigo-600 uppercase mb-4 tracking-widest flex items-center gap-2"><Info size={14}/> Skenario Masalah</h4>
                              <p className="text-sm text-slate-700 leading-relaxed font-bold italic">"{selectedRoom.problem}"</p>
                           </div>
                        </div>
                        <div className="lg:col-span-8 bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
                           <div className="space-y-10">
                              {selectedRoom.workspaceFields.map(field => (
                                 <div key={field.id} className="group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block transition-colors group-focus-within:text-indigo-600">{field.label}</label>
                                    <textarea 
                                       onFocus={() => setLastFocusedField(field.id)}
                                       value={answers[field.id] || ""}
                                       onChange={e => {
                                          const newAns = {...answers, [field.id]: e.target.value};
                                          setAnswers(newAns);
                                          syncToTeacher({ answers: newAns });
                                       }}
                                       placeholder={`Tuangkan pemikiran Anda tentang ${field.label}...`}
                                       className="w-full p-8 bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] outline-none focus:border-indigo-100 focus:bg-white transition-all font-bold text-slate-700 leading-relaxed min-h-[160px]" 
                                    />
                                 </div>
                              ))}
                           </div>
                           {aiResponse && (
                              <div className="mt-10 p-8 bg-indigo-50 border-l-8 border-indigo-600 rounded-r-[2.5rem] text-sm font-black text-indigo-900 leading-relaxed italic animate-in zoom-in-95">
                                 <div className="flex items-center gap-2 mb-3 text-[10px] text-indigo-400 uppercase tracking-tighter"><Brain size={16}/> Reflective Scaffolding AI</div>
                                 "{aiResponse}"
                              </div>
                           )}
                           <div className="mt-12 flex flex-col md:flex-row gap-4">
                              <button onClick={() => {
                                 setIsAiLoading(true);
                                 setTimeout(() => {
                                    const fieldName = selectedRoom.workspaceFields.find(f => f.id === lastFocusedField)?.label || "ini";
                                    setAiResponse(`Coba refleksikan lagi, apakah ada perspektif lain yang belum kamu pertimbangkan pada bagian ${fieldName}?`);
                                    setIsAiLoading(false);
                                 }, 800);
                              }} className="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-50">
                                 {isAiLoading ? 'Menganalisis...' : <><Brain size={20}/> Pancingan AI</>}
                              </button>
                              <button onClick={() => setView('dashboard')} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-200">Simpan & Dashboard</button>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            )}
            {showFactTestModal && <FactTestRunner />}
          </div>
        )}

        {/* --- FLOW DOSEN --- */}
        {userProfile.role === 'dosen' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {view === 'dashboard' ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-4xl font-black tracking-tighter text-slate-800">Observer Dashboard</h2>
                  <button onClick={() => {
                    const newR = {
                      id: Date.now(),
                      name: "Kelas Baru",
                      code: Math.random().toString(36).substring(2, 7).toUpperCase(),
                      matkul: "Mata Kuliah",
                      problem: "Masukkan narasi masalah di sini...",
                      workspaceFields: [{id: 'f1', label: 'Analisis Awal'}],
                      questions: []
                    };
                    setRooms([...rooms, newR]);
                  }} className="bg-indigo-600 text-white px-8 py-5 rounded-[2rem] font-black text-xs flex items-center gap-3 shadow-xl shadow-indigo-100 hover:scale-105 transition-all"><PlusCircle size={24}/> BUAT RUANG BELAJAR</button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rooms.map(r => (
                    <div key={r.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative">
                      <h3 className="text-2xl font-black tracking-tight text-slate-800">{r.name}</h3>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-2 mb-8">{r.matkul}</p>
                      <div className="flex items-center justify-between mb-8">
                         <div className="bg-slate-50 px-5 py-2 rounded-xl font-black text-xs border border-slate-100 uppercase tracking-widest text-slate-400">ID: {r.code}</div>
                         <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{r.questions.length} SOAL • {r.workspaceFields.length} STEP</div>
                      </div>
                      <button onClick={() => {setSelectedRoom(r); setView('room');}} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">Pilih Room <ChevronRight size={14}/></button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-8 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex gap-6 items-center">
                    <button onClick={() => setView('dashboard')} className="p-5 bg-white border-2 border-slate-100 rounded-3xl text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"><X size={24}/></button>
                    <div>
                       <h2 className="text-4xl font-black tracking-tighter text-slate-800">{selectedRoom.name}</h2>
                       <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] mt-1">Live Monitoring Panel</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setShowEditorial(true)} className="bg-white border-4 border-indigo-50 px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-50 transition-all text-indigo-600 shadow-sm"><Settings size={20}/> Edit Room</button>
                     <button onClick={() => setFactTestOpen(!factTestOpen)} className={`px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${factTestOpen ? 'bg-red-50 text-red-600 border-2 border-red-100 shadow-red-50' : 'bg-emerald-600 text-white shadow-emerald-100 hover:scale-105'}`}>{factTestOpen ? 'Hentikan Kuis' : 'Aktifkan Kuis'}</button>
                  </div>
                </div>

                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-32 -translate-y-32 opacity-50"></div>
                   <div className="flex justify-between items-center mb-10 relative z-10">
                      <h4 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-4 text-2xl"><Trophy className="text-amber-500" size={32}/> Pemantauan Capaian</h4>
                      <div className="flex gap-8 bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                         <div className="text-[10px] font-black uppercase flex items-center gap-3 text-slate-400">Level Super: <input type="number" value={thresholds.super} onChange={e => setThresholds({...thresholds, super: parseInt(e.target.value)})} className="w-14 bg-transparent border-b-4 border-indigo-200 text-indigo-600 outline-none text-center text-lg font-black" /></div>
                         <div className="text-[10px] font-black uppercase flex items-center gap-3 text-slate-400">Level Baik: <input type="number" value={thresholds.sangatBaik} onChange={e => setThresholds({...thresholds, sangatBaik: parseInt(e.target.value)})} className="w-14 bg-transparent border-b-4 border-indigo-200 text-indigo-600 outline-none text-center text-lg font-black" /></div>
                      </div>
                   </div>
                   <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                      {Object.entries(getGroupStats()).map(([name, stats]) => {
                         const avg = Math.round(stats.total / stats.count);
                         const pred = getPredikat(avg);
                         return (
                            <div key={name} className={`p-10 rounded-[3rem] border-4 bg-white transition-all hover:shadow-2xl ${pred.text} border-current relative group`}>
                               <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-50">Kelompok</h5>
                               <div className="text-3xl font-black mb-6 tracking-tighter">{name}</div>
                               <div className="flex items-end justify-between">
                                  <div className="text-5xl font-black">{avg} <span className="text-xs font-black opacity-30 uppercase tracking-widest">Score</span></div>
                                  <div className="px-5 py-2 rounded-xl bg-white border-2 border-current font-black text-[8px] uppercase tracking-widest whitespace-nowrap">{pred.label}</div>
                               </div>
                            </div>
                         );
                      })}
                      {Object.keys(getGroupStats()).length === 0 && <div className="col-span-full py-20 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                        <Users size={48} className="mb-4 opacity-20"/>
                        <p className="font-black uppercase tracking-[0.2em] italic">Belum ada tim yang aktif di sistem</p>
                      </div>}
                   </div>
                </div>

                <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm mt-8">
                   <div className="px-12 py-8 bg-slate-50/50 border-b border-slate-50">
                      <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Daftar Partisipan Real-time</h4>
                   </div>
                   <table className="w-full text-left">
                      <thead className="bg-white">
                         <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                            <th className="px-12 py-8">Nama Mahasiswa</th>
                            <th className="px-12 py-8">Identitas Kelompok</th>
                            <th className="px-12 py-8">Skor Kuis</th>
                            <th className="px-12 py-8 text-right">Aksi</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {studentsData.map(s => (
                            <tr key={s.id} className="hover:bg-indigo-50/20 transition-all group">
                               <td className="px-12 py-8 font-black text-slate-800 text-lg tracking-tight">{s.name}</td>
                               <td className="px-12 py-8">
                                 <span className="px-4 py-2 bg-slate-50 rounded-xl font-black text-indigo-600 text-[10px] border border-slate-100 uppercase tracking-widest">{s.group}</span>
                               </td>
                               <td className="px-12 py-8">
                                 <div className="flex items-center gap-3">
                                   <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                     <div className="h-full bg-indigo-500" style={{width: `${s.score}%`}}></div>
                                   </div>
                                   <span className="font-black text-lg text-slate-800">{s.score || 0}</span>
                                 </div>
                               </td>
                               <td className="px-12 py-8 text-right">
                                  <button onClick={() => setInspectingStudent(s)} className="p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm"><Eye size={20}/></button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </div>
            )}

            {/* EDITORIAL MANAGER */}
            {showEditorial && (
              <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[400] flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-7xl h-[92vh] rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                  <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h3 className="text-4xl font-black tracking-tighter text-slate-800">Ruang Konten</h3>
                      <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mt-2">Dosen Editorial Panel</p>
                    </div>
                    <button onClick={() => setShowEditorial(false)} className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] text-slate-400 hover:text-red-500 transition-all shadow-sm"><X size={28}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-12 grid lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 space-y-10">
                      <section className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 font-black"><Layout size={14}/> Narasi Masalah</h4>
                        <div className="space-y-4">
                           <input 
                             placeholder="Nama Kelas"
                             value={selectedRoom.name} 
                             onChange={e => {
                               const updated = {...selectedRoom, name: e.target.value};
                               setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                               setSelectedRoom(updated);
                             }} 
                             className="w-full p-4 bg-white border rounded-2xl font-black outline-none focus:border-indigo-500" 
                           />
                           <textarea 
                             placeholder="Deskripsi Masalah"
                             value={selectedRoom.problem} 
                             onChange={e => {
                               const updated = {...selectedRoom, problem: e.target.value};
                               setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                               setSelectedRoom(updated);
                             }} 
                             className="w-full p-4 bg-white border rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 min-h-[140px]" 
                           />
                        </div>
                      </section>

                      <section className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                           <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2"><Brain size={14}/> Step Scaffolding</h4>
                           <button onClick={() => {
                             const updated = {...selectedRoom, workspaceFields: [...selectedRoom.workspaceFields, {id: Date.now().toString(), label: 'Step Baru'}]};
                             setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                             setSelectedRoom(updated);
                           }} className="p-2 bg-indigo-600 text-white rounded-lg hover:rotate-90 transition-all"><Plus size={14}/></button>
                        </div>
                        <div className="space-y-3">
                           {selectedRoom.workspaceFields.map((f, idx) => (
                             <div key={f.id} className="flex gap-3 bg-white p-4 rounded-2xl border border-slate-100 items-center">
                                <span className="text-[10px] font-black text-indigo-200">{idx+1}</span>
                                <input value={f.label} onChange={e => {
                                  const updatedF = selectedRoom.workspaceFields.map(field => field.id === f.id ? {...field, label: e.target.value} : field);
                                  const updated = {...selectedRoom, workspaceFields: updatedF};
                                  setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                                  setSelectedRoom(updated);
                                }} className="flex-1 outline-none font-black text-xs text-slate-700" />
                                <button onClick={() => {
                                  const updatedF = selectedRoom.workspaceFields.filter(field => field.id !== f.id);
                                  const updated = {...selectedRoom, workspaceFields: updatedF};
                                  setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                                  setSelectedRoom(updated);
                                }} className="text-red-200 hover:text-red-500"><Trash2 size={16}/></button>
                             </div>
                           ))}
                        </div>
                      </section>
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                       <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-3"><Target size={16}/> Manajemen Soal Fact Test</h4>
                          <div className="flex gap-2">
                             {['pg', 'boolean', 'isian', 'foto'].map(type => (
                                <button key={type} onClick={() => {
                                   const newQ = { 
                                      id: Date.now(), 
                                      type, 
                                      text: "Pertanyaan baru...", 
                                      options: type === 'pg' ? ['A', 'B', 'C'] : [], 
                                      correct: type === 'boolean' ? 'Benar' : '' 
                                   };
                                   const updated = {...selectedRoom, questions: [...selectedRoom.questions, newQ]};
                                   setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                                   setSelectedRoom(updated);
                                }} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[9px] border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all uppercase tracking-[0.2em]">+ {type}</button>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-6">
                          {selectedRoom.questions.map((q, qIdx) => (
                             <div key={q.id} className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-6 group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                   <div className="flex items-center gap-3">
                                      <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">{qIdx + 1}</span>
                                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[9px] uppercase tracking-widest">{q.type}</span>
                                   </div>
                                   <button onClick={() => {
                                      const updatedQ = selectedRoom.questions.filter(item => item.id !== q.id);
                                      const updated = {...selectedRoom, questions: updatedQ};
                                      setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                                      setSelectedRoom(updated);
                                   }} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                                </div>

                                <div className="space-y-2">
                                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ketik Pertanyaan</label>
                                   <textarea value={q.text} onChange={e => {
                                      const updatedQ = selectedRoom.questions.map(item => item.id === q.id ? {...item, text: e.target.value} : item);
                                      const updated = {...selectedRoom, questions: updatedQ};
                                      setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                                      setSelectedRoom(updated);
                                   }} className="w-full p-4 bg-slate-50 rounded-2xl border-transparent focus:border-indigo-200 outline-none font-black text-slate-800" />
                                </div>

                                {q.type === 'pg' && (
                                   <div className="space-y-4 pt-4">
                                      <div className="flex justify-between items-center">
                                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Opsi Jawaban (Klik centang untuk kunci)</label>
                                         <button onClick={() => {
                                            const updatedQ = selectedRoom.questions.map(item => item.id === q.id ? {...item, options: [...item.options, 'Opsi Baru']} : item);
                                            const updated = {...selectedRoom, questions: updatedQ};
                                            setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                                            setSelectedRoom(updated);
                                         }} className="text-emerald-500 font-black text-[9px] uppercase hover:underline">+ Tambah Opsi</button>
                                      </div>
                                      <div className="grid md:grid-cols-2 gap-3">
                                         {q.options.map((opt, optIdx) => (
                                            <div key={optIdx} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${q.correct === opt ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10' : 'border-slate-100 bg-white'}`}>
                                               <input value={opt} onChange={e => {
                                                  const newOpts = [...q.options];
                                                  newOpts[optIdx] = e.target.value;
                                                  const updatedQ = selectedRoom.questions.map(item => item.id === q.id ? {...item, options: newOpts, correct: q.correct === opt ? e.target.value : q.correct} : item);
                                                  const updated = {...selectedRoom, questions: updatedQ};
                                                  setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                                                  setSelectedRoom(updated);
                                               }} className="flex-1 bg-transparent outline-none text-xs font-black text-slate-600" />
                                               <button onClick={() => {
                                                  const updatedQ = selectedRoom.questions.map(item => item.id === q.id ? {...item, correct: opt} : item);
                                                  const updated = {...selectedRoom, questions: updatedQ};
                                                  setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                                                  setSelectedRoom(updated);
                                               }} className={`p-1.5 rounded-md ${q.correct === opt ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-200 hover:text-emerald-500'}`}><Check size={14}/></button>
                                               <button onClick={() => {
                                                  const newOpts = q.options.filter((_, i) => i !== optIdx);
                                                  const updatedQ = selectedRoom.questions.map(item => item.id === q.id ? {...item, options: newOpts} : item);
                                                  const updated = {...selectedRoom, questions: updatedQ};
                                                  setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                                                  setSelectedRoom(updated);
                                               }} className="text-slate-100 hover:text-red-500"><X size={16}/></button>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                )}

                                {q.type === 'boolean' && (
                                   <div className="flex gap-4 pt-4">
                                      <button onClick={() => {
                                         const updatedQ = selectedRoom.questions.map(item => item.id === q.id ? {...item, correct: 'Benar'} : item);
                                         const updated = {...selectedRoom, questions: updatedQ};
                                         setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                                         setSelectedRoom(updated);
                                      }} className={`flex-1 py-4 rounded-2xl font-black text-[10px] border-2 transition-all ${q.correct === 'Benar' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}>KUNCI: BENAR</button>
                                      <button onClick={() => {
                                         const updatedQ = selectedRoom.questions.map(item => item.id === q.id ? {...item, correct: 'Salah'} : item);
                                         const updated = {...selectedRoom, questions: updatedQ};
                                         setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                                         setSelectedRoom(updated);
                                      }} className={`flex-1 py-4 rounded-2xl font-black text-[10px] border-2 transition-all ${q.correct === 'Salah' ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}>KUNCI: SALAH</button>
                                   </div>
                                )}

                                {q.type === 'isian' && (
                                   <div className="pt-4 space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Definisikan Jawaban Benar</label>
                                      <input value={q.correct} onChange={e => {
                                         const updatedQ = selectedRoom.questions.map(item => item.id === q.id ? {...item, correct: e.target.value} : item);
                                         const updated = {...selectedRoom, questions: updatedQ};
                                         setRooms(rooms.map(r => r.id === selectedRoom.id ? updated : r));
                                         setSelectedRoom(updated);
                                      }} placeholder="Teks jawaban tepat..." className="w-full p-4 bg-emerald-50 rounded-2xl border-emerald-100 outline-none font-black text-emerald-900" />
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {inspectingStudent && (
              <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[400] flex items-center justify-end">
                 <div className="bg-white w-full max-w-2xl h-full p-16 overflow-y-auto animate-in slide-in-from-right duration-500 shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center mb-12">
                       <div>
                          <h3 className="text-4xl font-black tracking-tighter text-slate-800">Lembar Jawaban</h3>
                          <p className="text-xs font-black text-indigo-400 uppercase mt-2">{inspectingStudent.name} • TIM {inspectingStudent.group}</p>
                       </div>
                       <button onClick={() => setInspectingStudent(null)} className="p-5 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"><X size={28}/></button>
                    </div>

                    <div className="space-y-12">
                       <section>
                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 border-b-2 border-indigo-50 pb-2">Hasil Konstruksi Berpikir</h4>
                          <div className="space-y-6">
                             {selectedRoom.workspaceFields.map(f => (
                                <div key={f.id} className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 group">
                                   <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block tracking-widest group-hover:text-indigo-500 transition-colors">{f.label}</label>
                                   <p className="font-bold text-slate-700 italic leading-relaxed text-sm">"{inspectingStudent.answers[f.id] || '(Kosong)'}"</p>
                                </div>
                             ))}
                          </div>
                       </section>

                       <section>
                          <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 border-b-2 border-emerald-50 pb-2">Detail Fact Test</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                              <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Benar</div>
                              <div className="text-3xl font-black text-indigo-600">{(inspectingStudent.score / 100) * selectedRoom.questions.length} / {selectedRoom.questions.length}</div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                              <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Skor Akhir</div>
                              <div className="text-3xl font-black text-emerald-600">{inspectingStudent.score}</div>
                            </div>
                          </div>
                       </section>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;