
import React, { useState, useEffect, useRef } from 'react';

// Declaração global para Html5Qrcode pois está vindo via script tag no index.html
declare const Html5Qrcode: any;

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const scannerRef = useRef<any>(null);
  const containerId = "qr-reader";

  useEffect(() => {
    if (isOpen) {
      Html5Qrcode.getCameras().then((devices: any[]) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCamera = devices.find(device => 
            /back|rear|traseira|environment/i.test(device.label.toLowerCase())
          );
          const defaultCameraId = backCamera ? backCamera.id : devices[devices.length - 1].id;
          setSelectedCameraId(defaultCameraId);
        }
      }).catch((err: any) => console.error("Erro ao listar câmeras", err));
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    if (!selectedCameraId) return;
    scannerRef.current = new Html5Qrcode(containerId);
    try {
      setIsScanning(true);
      await scannerRef.current.start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText: string) => {
          onScanSuccess(decodedText);
          onClose();
        },
        (errorMessage: string) => {}
      );
    } catch (err) {
      console.error("Falha ao iniciar scanner", err);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
        setIsTorchOn(false);
      } catch (err) {
        console.error("Erro ao parar scanner", err);
      }
    }
  };

  const toggleTorch = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        const state = !isTorchOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: state }]
        });
        setIsTorchOn(state);
      } catch (err) {
        console.warn("Flash não suportado neste dispositivo", err);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode(containerId);
    html5QrCode.scanFile(file, true)
      .then(decodedText => {
        onScanSuccess(decodedText);
        onClose();
      })
      .catch(err => {
        alert("Não foi possível detectar um código nesta imagem.");
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-[#1e293b]/50 backdrop-blur-xl">
          <div>
            <h3 className="text-2xl font-black text-[#111827] dark:text-white tracking-tighter">Leitor de Código</h3>
            <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1">QR Code & Barras</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 dark:bg-[#0f172a] text-gray-400 hover:text-brand rounded-2xl transition-all border border-gray-100 dark:border-gray-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-grow flex flex-col p-6 sm:p-10 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="relative aspect-square w-full max-w-[320px] mx-auto bg-gray-100 dark:bg-black/40 rounded-[2.5rem] overflow-hidden border-4 border-gray-50 dark:border-gray-800 shadow-inner flex items-center justify-center">
            <div id={containerId} className="w-full h-full"></div>
            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-white dark:bg-[#1e293b] rounded-3xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <p className="text-sm font-bold text-gray-400">A câmera está desligada. Clique em "Iniciar Câmera" para escanear.</p>
              </div>
            )}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none z-10 border-2 border-brand/20">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-brand shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-scan-line"></div>
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-brand rounded-tl-lg"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-brand rounded-tr-lg"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-brand rounded-bl-lg"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-brand rounded-br-lg"></div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-grow">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-2">Selecionar Câmera</label>
                <select 
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    if (isScanning) {
                      stopScanner().then(() => startScanner());
                    }
                  }}
                  className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                >
                  {cameras.length > 0 ? cameras.map(cam => (
                    <option key={cam.id} value={cam.id}>{cam.label || `Câmera ${cam.id.slice(0,4)}`}</option>
                  )) : (
                    <option value="">Nenhuma câmera detectada</option>
                  )}
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <button 
                  onClick={toggleTorch}
                  disabled={!isScanning}
                  className={`p-4 rounded-2xl border transition-all ${isTorchOn ? 'bg-orange-500 border-orange-600 text-white' : 'bg-gray-50 dark:bg-[#0f172a] border-gray-100 dark:border-gray-800 text-gray-400'} disabled:opacity-30`}
                  title="Lanterna"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={isScanning ? stopScanner : startScanner}
                className={`flex items-center justify-center space-x-3 p-5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl ${isScanning ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-brand text-white shadow-brand/20 hover:scale-105 active:scale-95'}`}
              >
                {isScanning ? (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>Desligar</span></>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>Iniciar</span></>
                )}
              </button>
              <label className="flex items-center justify-center space-x-3 p-5 rounded-2xl font-black text-sm uppercase tracking-wider bg-gray-100 dark:bg-[#0f172a] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 hover:border-brand hover:text-brand transition-all cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <span>Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
