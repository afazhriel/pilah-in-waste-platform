import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeMemberQrPayload, parseAndMatchMemberQr } from './qrMember';
import { initialMembers } from '../data/seedData';

test('encodeMemberQrPayload creates canonical Hafi Digital QR string', () => {
  const member = initialMembers[0]; // PLH-0001 - Ibu Ratna Sari
  const payload = encodeMemberQrPayload(member);
  assert.equal(
    payload,
    'HAFI-DIGITAL|PILAHIN|PLH-0001|mem-001|Ibu Ratna Sari'
  );
});

test('parseAndMatchMemberQr matches canonical Hafi Digital payload', () => {
  const payload = encodeMemberQrPayload(initialMembers[3]); // PLH-0004 - Pak Dedi Kurniawan
  const res = parseAndMatchMemberQr(payload, initialMembers);
  assert.equal(res.matched, true);
  assert.equal(res.member?.id, 'mem-004');
  assert.equal(res.extractedCode, 'PLH-0004');
});

test('parseAndMatchMemberQr matches raw memberCode case-insensitively and URLs', () => {
  const res1 = parseAndMatchMemberQr('plh-0002', initialMembers);
  assert.equal(res1.matched, true);
  assert.equal(res1.member?.fullName, 'Pak Bambang Hermawan');

  const res2 = parseAndMatchMemberQr('https://pilah.in/verify?card=PLH-0005', initialMembers);
  assert.equal(res2.matched, true);
  assert.equal(res2.member?.memberCode, 'PLH-0005');
});

test('parseAndMatchMemberQr matches JSON QR payload', () => {
  const jsonPayload = JSON.stringify({
    issuer: 'Hafi Digital',
    memberCode: 'PLH-0003',
  });
  const res = parseAndMatchMemberQr(jsonPayload, initialMembers);
  assert.equal(res.matched, true);
  assert.equal(res.member?.id, 'mem-003');
});

test('parseAndMatchMemberQr returns informative error on unknown or empty QR', () => {
  const emptyRes = parseAndMatchMemberQr('   ', initialMembers);
  assert.equal(emptyRes.matched, false);
  assert.ok(emptyRes.error?.includes('kosong'));

  const unknownCodeRes = parseAndMatchMemberQr('HAFI-DIGITAL|PILAHIN|PLH-9999', initialMembers);
  assert.equal(unknownCodeRes.matched, false);
  assert.equal(unknownCodeRes.extractedCode, 'PLH-9999');
  assert.ok(unknownCodeRes.error?.includes('PLH-9999'));
});
