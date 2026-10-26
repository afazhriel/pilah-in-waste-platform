import { Member } from '../types';

export const HAFI_DIGITAL_BRAND = 'Dalam Naungan Hafi Digital';
export const HAFI_DIGITAL_QR_PREFIX = 'HAFI-DIGITAL|PILAHIN';

/**
 * Generates the canonical QR payload for a Pilah.in digital member card
 * under Hafi Digital governance.
 */
export function encodeMemberQrPayload(
  member: Pick<Member, 'id' | 'memberCode' | 'fullName' | 'qrCodeToken'>
): string {
  const code = (member.memberCode || '').trim().toUpperCase();
  const id = (member.id || '').trim();
  const name = (member.fullName || '').trim();
  return `${HAFI_DIGITAL_QR_PREFIX}|${code}|${id}|${name}`;
}

export interface QrMatchResult {
  matched: boolean;
  member?: Member;
  extractedCode?: string;
  rawPayload: string;
  error?: string;
}

/**
 * Parses any scanned QR code string (canonical Hafi Digital payload, JSON, URL,
 * raw memberCode like PLH-0001, qrCodeToken, or NIK) and matches against the
 * registered members directory.
 */
export function parseAndMatchMemberQr(
  rawScannedText: string,
  members: Member[]
): QrMatchResult {
  const cleaned = (rawScannedText || '').trim();
  if (!cleaned) {
    return {
      matched: false,
      rawPayload: '',
      error: 'Data QR kosong atau tidak terbaca.',
    };
  }

  const normalizedUpper = cleaned.toUpperCase();

  // 1. Check pipe-delimited Hafi Digital / Pilah.in format: HAFI-DIGITAL|PILAHIN|PLH-0001|mem-001|...
  if (normalizedUpper.startsWith('HAFI-DIGITAL|') || normalizedUpper.startsWith('PILAHIN|')) {
    const parts = cleaned.split('|').map((p) => p.trim());
    // Usually parts[2] is memberCode, parts[3] is id
    for (const part of parts) {
      const found = members.find(
        (m) =>
          m.memberCode.toUpperCase() === part.toUpperCase() ||
          m.id.toLowerCase() === part.toLowerCase()
      );
      if (found) {
        return {
          matched: true,
          member: found,
          extractedCode: found.memberCode,
          rawPayload: cleaned,
        };
      }
    }
  }

  // 2. Check JSON payload if it starts with '{'
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleaned);
      const candidateCode = String(parsed.memberCode || parsed.code || '').toUpperCase();
      const candidateId = String(parsed.memberId || parsed.id || '');
      const found = members.find(
        (m) =>
          (candidateCode && m.memberCode.toUpperCase() === candidateCode) ||
          (candidateId && m.id === candidateId)
      );
      if (found) {
        return {
          matched: true,
          member: found,
          extractedCode: found.memberCode,
          rawPayload: cleaned,
        };
      }
    } catch {
      // fall through to regex/string matching
    }
  }

  // 3. Exact match by memberCode, id, qrCodeToken, or NIK
  const directMatch = members.find(
    (m) =>
      m.memberCode.toUpperCase() === normalizedUpper ||
      m.id.toLowerCase() === cleaned.toLowerCase() ||
      (m.qrCodeToken && m.qrCodeToken.toUpperCase() === normalizedUpper) ||
      (m.nik && m.nik === cleaned)
  );
  if (directMatch) {
    return {
      matched: true,
      member: directMatch,
      extractedCode: directMatch.memberCode,
      rawPayload: cleaned,
    };
  }

  // 4. Extract PLH-XXXX pattern anywhere inside a URL or colon-separated string
  const codeRegexMatch = normalizedUpper.match(/\b(PLH-\d{3,6})\b/);
  if (codeRegexMatch) {
    const codeCandidate = codeRegexMatch[1];
    const foundByPattern = members.find(
      (m) => m.memberCode.toUpperCase() === codeCandidate
    );
    if (foundByPattern) {
      return {
        matched: true,
        member: foundByPattern,
        extractedCode: foundByPattern.memberCode,
        rawPayload: cleaned,
      };
    }
    return {
      matched: false,
      extractedCode: codeCandidate,
      rawPayload: cleaned,
      error: `Kartu QR dengan kode nasabah "${codeCandidate}" tidak terdaftar di unit ini.`,
    };
  }

  return {
    matched: false,
    rawPayload: cleaned,
    error: `Kode QR "${cleaned.slice(0, 36)}" tidak dikenali sebagai Kartu Nasabah Pilah.in · Hafi Digital.`,
  };
}
