// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import React from 'react';
import {render,screen,within,cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/app';
import {all,clearUserData,save,saveSettings,type ActivityLog,type Child} from '../src/db';

Object.defineProperty(window,'scrollTo',{value:()=>{},configurable:true});
beforeEach(async()=>{window.history.replaceState(null,'','/');await clearUserData()});
afterEach(()=>{cleanup();vi.restoreAllMocks()});

const child:Child={id:'anak-uji',nickname:'Nara',dateOfBirth:'2026-07-01',prematurityStatus:'no',useCorrectedAge:false,focusDomains:[],createdAt:'2026-07-01T10:00:00.000Z',updatedAt:'2026-07-01T10:00:00.000Z'};

it('melewati pengamatan awal, meminta respons sendiri, dan membuka panduan ibu yang bisa dibeli',async()=>{
 const user=userEvent.setup();render(<App/>);
 await user.click(await screen.findByRole('button',{name:'Mulai'}));
 await user.type(screen.getByRole('textbox',{name:'Nama panggilan'}),'Nara');
 await user.type(screen.getByLabelText('Tanggal lahir'),'2026-07-01');
 await user.click(screen.getByRole('button',{name:'Tidak',exact:true}));
 await user.click(screen.getByRole('button',{name:'Simpan profil'}));
 await screen.findByText('Mana yang pernah Ayah Bunda lihat?');
 await user.click(screen.getByRole('button',{name:'Lihat Aktivitas Hari Ini'}));
 expect(await screen.findByText(/Hari ini bersama Nara/)).toBeTruthy();
 await user.click(screen.getByRole('button',{name:/Mulai Aktivitas/}));
 await screen.findByText('Cara melakukan');
 await user.click(screen.getByRole('button',{name:'Mulai Aktivitas'}));
 await user.click(screen.getByRole('button',{name:'Selesai'}));
 expect(screen.getByRole('button',{name:'Simpan Momen'}).hasAttribute('disabled')).toBe(true);
 await user.click(screen.getByRole('button',{name:'😴 Sedang lelah'}));
 await user.click(screen.getByRole('button',{name:'Simpan Momen'}));
 expect(await screen.findByText(/Momen hari ini sudah tersimpan/)).toBeTruthy();
 expect((await all<ActivityLog>('activityLogs'))[0]?.response).toBe('tired');
 expect(screen.queryByRole('dialog',{name:'Pengingat bermain'})).toBeNull();
 await user.click(screen.getByRole('button',{name:'Perkembangan',exact:true}));
 expect(await screen.findByText('RINGKASAN & LANGKAH BERIKUTNYA')).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'Profil',exact:true}));
 await user.click(await screen.findByRole('button',{name:/Untuk Keluarga/}));
 expect(await screen.findByText('Baby Blues & Depresi Postpartum — Kenali dan Hadapi')).toBeTruthy();
 expect(screen.getByRole('link',{name:/Lihat dan Beli Panduan/}).getAttribute('href')).toBe('https://shaluni-store1.myscalev.com/p/baby-blues-depresi-postpartum-kenali-dan-hadapi');
 expect(screen.queryByText('Segera Hadir')).toBeNull();
});

it('mengedit tanggal lahir tanpa menghilangkan identitas anak dan catatan yang sudah ada',async()=>{
 await save('children',child);await saveSettings({activeChildId:child.id});
 const log:ActivityLog={id:'log-lama',childId:child.id,activityId:'ACT002',contentVersion:'uji',startedAt:'2026-09-25T10:00:00Z',completedAt:'2026-09-25T10:05:00Z',localDate:'2026-09-25',response:'tried',snapshot:{title:'Gerak Bebas di Matras',primaryDomain:'Gerak Tubuh',benefitShort:'Bermain'}};
 await save('activityLogs',log);
 const user=userEvent.setup();render(<App/>);
 await user.click(await screen.findByRole('button',{name:'Profil',exact:true}));
 await user.click(screen.getByRole('button',{name:/Profil Si Kecil/}));
 await user.click(screen.getByRole('button',{name:'Edit Profil Si Kecil'}));
 const input=screen.getByLabelText('Tanggal lahir');
 await user.clear(input);await user.type(input,'2026-08-01');
 await user.click(screen.getByRole('button',{name:'Simpan perubahan'}));
 expect(await screen.findByText('Tanggal lahir: 2026-08-01')).toBeTruthy();
 expect((await all<Child>('children'))[0]?.id).toBe(child.id);
 expect((await all<ActivityLog>('activityLogs'))[0]?.id).toBe(log.id);
});

it('menampilkan aktivitas usia lain sebagai bacaan tanpa tombol mulai',async()=>{
 await save('children',child);await saveSettings({activeChildId:child.id});
 window.history.replaceState(null,'','/aktivitas/ACT001');
 render(<App/>);
 expect(await screen.findByText('Tummy Time di Dada')).toBeTruthy();
 expect(screen.getByText(/Aktivitas di luar usia acuan tidak bisa dimulai atau dicatat/)).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Mulai Aktivitas'})).toBeNull();
});

it('mengoreksi respons dan menghapus pengamatan terkait saat aktivitas dihapus',async()=>{
 await save('children',child);await saveSettings({activeChildId:child.id});
 const log:ActivityLog={id:'log-1',childId:child.id,activityId:'ACT002',contentVersion:'uji',startedAt:'2026-09-25T10:00:00.000Z',completedAt:'2026-09-25T10:05:00.000Z',localDate:'2026-09-25',response:'tried',snapshot:{title:'Gerak Bebas di Matras',primaryDomain:'Gerak Tubuh',benefitShort:'Bermain'}};
 await save('activityLogs',log);await save('observations',{id:'obs-1',childId:child.id,skillId:'SK001',status:'seen',observedAt:'2026-09-25T10:05:00.000Z',activityLogId:log.id});
 window.history.replaceState(null,'','/perjalanan');
 const user=userEvent.setup();render(<App/>);
 const card=(await screen.findByRole('heading',{name:'Gerak Bebas di Matras'})).closest('article')!;
 await user.click(within(card).getByRole('button',{name:'Koreksi Catatan'}));
 await user.click(within(card).getByRole('button',{name:'😴 Sedang lelah'}));
 await user.click(within(card).getByRole('button',{name:'Simpan Perubahan'}));
 expect((await all<ActivityLog>('activityLogs'))[0]?.response).toBe('tired');
 await user.click(within(card).getByRole('button',{name:'Hapus Catatan'}));
 await user.click(within(card).getByRole('button',{name:'Ya, Hapus Catatan'}));
 expect(await all<ActivityLog>('activityLogs')).toHaveLength(0);
 expect(await all('observations')).toHaveLength(0);
});
