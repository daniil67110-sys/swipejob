import { ImageResponse } from 'next/og';
import { auth } from '@/lib/auth';
import { getWrappedData } from '@/lib/wrapped';

/**
 * Story 5.5 — image OG dynamique 1080x1920 (format Instagram Story).
 *
 * Authentifiée : seul le user propriétaire de l'application peut générer son
 * image. Pas de cache CDN (Cache-Control: no-store) car les données sont
 * personnelles et l'image embarque company/jobTitle/stats.
 */

export const runtime = 'nodejs';

const WIDTH = 1080;
const HEIGHT = 1920;

type Params = { applicationId: string };

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const data = await getWrappedData({
    applicationId: params.applicationId,
    userId: session.user.id,
  });
  if (!data) {
    return new Response('Not found', { status: 404 });
  }

  return new ImageResponse(
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #FF7B5A 0%, #4F5BFF 50%, #1FB87A 100%)',
        padding: 80,
        color: '#FFFFFF',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Top brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          S
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>SwipeJob</div>
      </div>

      {/* Hero */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flex: 1,
          marginTop: 60,
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontWeight: 600,
            opacity: 0.9,
            marginBottom: 24,
          }}
        >
          🎉 C&apos;est signé !
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -3,
            marginBottom: 28,
          }}
        >
          {data.jobTitle}
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 500,
            opacity: 0.92,
            letterSpacing: -1,
          }}
        >
          chez {data.companyName}
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          marginTop: 60,
        }}
      >
        <StatCardOg label="Jours de recherche" value={data.searchDurationDays} />
        <StatCardOg label="Candidatures" value={data.applicationsSent} />
        <StatCardOg label="Entretiens" value={data.interviewsScheduled} />
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 60,
          fontSize: 36,
          fontWeight: 600,
          opacity: 0.9,
        }}
      >
        swipejob.fr
      </div>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}

function StatCardOg({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.18)',
        borderRadius: 32,
        padding: 36,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 28, opacity: 0.85, fontWeight: 500 }}>{label}</div>
    </div>
  );
}
