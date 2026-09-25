// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import React from 'react';
import {render,screen,within,cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/app';
import {all,clearUserData,type ActivityLog} from '../src/db';
Object.defineProperty(window,'scrollTo',{value:()=>{},configurable:true});
beforeEach(async()=>{window.history.replaceState(null,'','/');await clearUserData()});
afterEach(()=>{cleanup();vi.restoreAllMocks()});
it('onboarding, aktivitas, pencatatan, dan panduan untuk ibu berjalan tanpa data dummy',async()=>{const user=userEvent.setup();render(<App/>);await user.click(await screen.findByRole('button',{name:'Mulai'}));await user.type(screen.getByRole('textbox',{name:'Nama panggilan'}),'Nara');await user.type(screen.getByLabelText('Tanggal lahir'),'2026-07-01');await user.click(screen.getByRole('button',{name:'Tidak',exact:true}));await user.click(screen.getByRole('button',{name:'Simpan profil'}));await screen.findByText('Mana yang pernah Ayah Bunda lihat?');await user.click(screen.getByRole('button',{name:'Lanjut'}));await user.click(await screen.findByRole('button',{name:'Lihat Aktivitas Hari Ini'}));expect(await screen.findByText(/Hari ini bersama Nara/)).toBeTruthy();expect(screen.queryByText(/Pratinjau konten/)).toBeNull();await user.click(screen.getByRole('button',{name:/Mulai Aktivitas/}));await screen.findByText('Cara melakukan');await user.click(screen.getByRole('button',{name:'Mulai Aktivitas'}));await user.click(screen.getByRole('button',{name:'Selesai'}));await user.click(screen.getByRole('button',{name:'Simpan Momen'}));expect(await screen.findByText(/Momen hari ini sudah tersimpan/)).toBeTruthy();expect((await all<ActivityLog>('activityLogs')).filter(l=>l.childId)).toHaveLength(1);await user.click(screen.getByRole('button',{name:'Nanti Saja'}));await user.click(screen.getByRole('button',{name:'Profil',exact:true}));await user.click(await screen.findByRole('button',{name:/Untuk Keluarga/}));expect(await screen.findByText('Baby Blues & Depresi Postpartum — Kenali dan Hadapi')).toBeTruthy();expect(screen.getByText(/Rp\s*49\.000/)).toBeTruthy();expect(screen.getByText('Segera Hadir')).toBeTruthy();expect(screen.queryByRole('link',{name:/Beli/})).toBeNull()});
