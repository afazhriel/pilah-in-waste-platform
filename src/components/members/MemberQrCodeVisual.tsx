import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Member } from '../../types';
import { encodeMemberQrPayload } from '../../utils/qrMember';

interface MemberQrCodeVisualProps {
  member: Pick<Member, 'id' | 'memberCode' | 'fullName' | 'qrCodeToken'>;
  size?: number;
  className?: string;
}

export const MemberQrCodeVisual: React.FC<MemberQrCodeVisualProps> = ({
  member,
  size = 148,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrError, setQrError] = useState<boolean>(false);
  const payload = encodeMemberQrPayload(member);

  useEffect(() => {
    if (!canvasRef.current) return;
    setQrError(false);
    QRCode.toCanvas(
      canvasRef.current,
      payload,
      {
        width: size,
        margin: 1,
        color: {
          dark: '#0B0E14',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      },
      (err) => {
        if (err) {
          setQrError(true);
        }
      }
    );
  }, [payload, size]);

  return (
    <div
      className={`inline-flex flex-col items-center justify-center rounded-xl bg-white p-2.5 shadow-sm border border-slate-200/80 ${className}`}
      data-testid={`qr-visual-${member.memberCode}`}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        aria-label={`Kode QR Nasabah ${member.fullName} (${member.memberCode})`}
        className="block rounded-lg"
      />
      {qrError && (
        <span className="text-[10px] font-mono text-slate-700 mt-1">{member.memberCode}</span>
      )}
    </div>
  );
};
