import { Pencil, Trash2, Tag, Utensils } from 'lucide-react';
import Image from 'next/image';

interface MenuCardProps {
  menu: {
    id_masakan: number;
    nama_masakan: string;
    harga: number;
    status_masakan: string;
    kategori: string;
    deskripsi: string;
    gambar?: string;
  };
  onEdit: (menu: any) => void;
  onDelete: (id: number) => void;
}

export default function MenuCard({ menu, onEdit, onDelete }: MenuCardProps) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-2xl group transition-all duration-500 hover:-translate-y-2">
      {/* 1. Background Image Layer */}
      <div className="absolute inset-0 z-0">
        {menu.gambar ? (
          <Image
            src={menu.gambar}
            alt={menu.nama_masakan}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
            <Utensils className="w-20 h-20 text-white/20" />
          </div>
        )}
      </div>

      {/* 2. Gradient Overlay (Untuk keterbacaan teks seperti di gambar) */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* 3. Content Layer */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-4">
        
        {/* Title & Price Row */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md max-w-[70%]">
            {menu.nama_masakan}
          </h3>
          <span className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-2xl text-white font-bold text-xs">
            Rp {menu.harga.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm line-clamp-2 mb-4 drop-shadow-sm">
          {menu.deskripsi || 'Nikmati kelezatan menu pilihan terbaik kami dengan bahan berkualitas.'}
        </p>

        {/* Badges Row (Top Rated style) */}
        <div className="flex gap-2 mb-6">
          <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
            {menu.kategori}
          </span>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10 backdrop-blur-md ${
            menu.status_masakan === 'tersedia' 
              ? 'bg-green-500/30 text-green-200' 
              : 'bg-red-500/30 text-red-200'
          }`}>
            {menu.status_masakan === 'tersedia' ? 'Tersedia' : 'Habis'}
          </span>
        </div>

        {/* 4. Action Buttons (Admin Mode) */}
        {/* Meniru tombol "Reserve" putih di gambar, tapi dibagi dua untuk Admin */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(menu)}
            className="flex-1 bg-white hover:bg-gray-200 text-black font-semibold py-1 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(menu.id_masakan)}
            className="w-14 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded-[1.5rem] transition-colors shadow-lg"
            title="Hapus Menu"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pagination dots dekoratif (seperti di gambar) */}
      <div className="absolute top-1/2 right-1/2 translate-x-1/2 z-20 flex gap-1 opacity-50">
        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
      </div>
    </div>
  );
}