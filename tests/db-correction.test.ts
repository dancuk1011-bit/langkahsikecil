// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import {it,expect} from 'vitest';
import {all,clearUserData,deleteEntryForChild,save,type ActivityLog,type Observation} from '../src/db';

it('menolak penghapusan milik anak lain dan menghapus pengamatan terhubung secara atomik',async()=>{
 await clearUserData();
 const log:ActivityLog={id:'catatan-a',childId:'anak-a',activityId:'ACT002',contentVersion:'uji',startedAt:'2026-09-25T10:00:00Z',localDate:'2026-09-25',completedAt:'2026-09-25T10:05:00Z',response:'tried',snapshot:{title:'Gerak Bebas',primaryDomain:'Gerak Tubuh',benefitShort:'Bermain'}};
 const tied:Observation={id:'pengamatan-a',childId:'anak-a',skillId:'SK001',status:'seen',observedAt:'2026-09-25T10:05:00Z',activityLogId:log.id};
 const other:Observation={...tied,id:'pengamatan-b',childId:'anak-b'};
 await save('activityLogs',log);await save('observations',tied);await save('observations',other);
 expect(await deleteEntryForChild('anak-b','activityLogs',log.id)).toBe(false);
 expect(await all<ActivityLog>('activityLogs')).toHaveLength(1);
 expect(await deleteEntryForChild('anak-a','activityLogs',log.id)).toBe(true);
 expect(await all<ActivityLog>('activityLogs')).toHaveLength(0);
 expect((await all<Observation>('observations')).map(o=>o.id)).toEqual([other.id]);
});
