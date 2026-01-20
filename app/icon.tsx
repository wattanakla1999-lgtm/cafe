import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
    width: 32,
    height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FDFBF7',
                    borderRadius: '6px',
                }}
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 512 512"
                    fill="none"
                >
                    <path
                        d="M140 200C140 200 140 260 140 280C140 346.274 193.726 400 260 400C326.274 400 380 346.274 380 280V200H140Z"
                        stroke="#4A3525"
                        strokeWidth="50"
                    />
                    <path
                        d="M380 230H410C432.091 230 450 247.909 450 270C450 292.091 432.091 310 410 310H380"
                        stroke="#4A3525"
                        strokeWidth="50"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        ),
        {
            ...size,
        }
    );
}
