const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../cloud.js'),'utf8');
let now=Date.now(),calls=[],reply=null;
class Clock extends Date {static now(){return now}}
function create(config){const context={window:{SIX_FACED_CLOUD_CONFIG:config},Date:Clock,AbortController,setTimeout,clearTimeout,TypeError,fetch:async(url,options)=>{calls.push({url,options});if(reply instanceof Error)throw reply;return reply}};vm.createContext(context);vm.runInContext(source,context);return context.window.SixFacedCloud;}
const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
const loginReply=()=>response({access_token:'test-only-token',expires_in:60,user:{id:'00000000-0000-4000-8000-000000000001',email:'fixture@example.invalid'}});
(async()=>{
 for(const config of [{},{url:'https://fixture.supabase.co',publishableKey:'sb_secret_DO_NOT_USE'},{url:'http://fixture.supabase.co',publishableKey:'sb_publishable_fixture'},{url:'https://other.example',publishableKey:'sb_publishable_fixture'}]){
  const cloud=create(config);assert(!cloud.configured);await assert.rejects(()=>cloud.authenticate('a','b'));assert.equal(calls.length,0);
 }
 const cloud=create({url:'https://fixture.supabase.co',publishableKey:'sb_publishable_fixture'});assert(cloud.configured);await assert.rejects(()=>cloud.read());
 reply=loginReply();await cloud.authenticate('fixture@example.invalid','test-password');assert.equal(cloud.currentUser().email,'fixture@example.invalid');assert(!JSON.stringify(cloud.currentUser()).includes('token'));
 assert(calls.at(-1).url.endsWith('/auth/v1/token?grant_type=password'));assert.equal(calls.at(-1).options.credentials,'omit');assert.equal(calls.at(-1).options.referrerPolicy,'no-referrer');
 reply=response([]);assert.equal(await cloud.read(),null);assert.equal(calls.at(-1).options.headers.Authorization,'Bearer test-only-token');
 reply=response(1);assert.equal(await cloud.write({format:'six-faced-life-save'},0),1);const body=JSON.parse(calls.at(-1).options.body);assert.equal(body.p_expected_revision,0);assert(!('user_id'in body));
 reply=response({code:'40001'},409);await assert.rejects(()=>cloud.write({},1),/另一设备/);reply=response({code:'23505'},409);await assert.rejects(()=>cloud.write({},0),/另一设备/);
 reply=response({},401);await assert.rejects(()=>cloud.read());assert.equal(cloud.currentUser(),null);
 reply=loginReply();await cloud.authenticate('fixture@example.invalid','test-password');now+=61000;assert.equal(cloud.currentUser(),null);await assert.rejects(()=>cloud.read());
 reply=response({id:'pending-verification'});assert.equal(await cloud.authenticate('fixture@example.invalid','test-password',true),null);assert(calls.at(-1).url.endsWith('/auth/v1/signup'));
 reply=loginReply();await cloud.authenticate('fixture@example.invalid','test-password');reply=new TypeError('network');await assert.rejects(()=>cloud.logout(),/网络/);assert.equal(cloud.currentUser(),null);
 const sql=fs.readFileSync(path.join(__dirname,'../cloud/schema.sql'),'utf8');assert(sql.includes('enable row level security'));assert(sql.includes('security invoker'));assert(sql.includes('revision=p_expected_revision'));assert(!/security definer/i.test(sql));
 console.log('PASS cloud adapter mocked tests: disabled configuration, no secret keys, login/register, identity/token boundary, own-row reads, revision conflicts, expiry, logout network failure. Live service/RLS not exercised.');
})().catch(e=>{console.error(e);process.exitCode=1});
