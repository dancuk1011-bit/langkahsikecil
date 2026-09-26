import {it,expect} from 'vitest';
import {makeCalendarEvent} from '../src/push';

it('mengikuti hari yang dipilih dan memulai pada hari berikutnya yang cocok',()=>{
 const event=makeCalendarEvent('09:00',[1,3,5],new Date(2026,8,26,10,0));
 expect(event).toContain('DTSTART:20260928T090000');
 expect(event).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR');
 expect(event).not.toContain('FREQ=DAILY');
});

it('menolak jadwal tanpa hari yang dipilih',()=>expect(()=>makeCalendarEvent('09:00',[],new Date(2026,8,26,10))).toThrow(/setidaknya satu hari/));
