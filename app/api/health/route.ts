import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

/**
 * HEAD /api/health
 * Lightweight health check endpoint supporting HTTP HEAD method.
 * Runs a minimal DB query (select 1) to verify database connectivity.
 * Returns 200 OK with empty body if healthy, 503 if DB error occurs.
 */
export async function HEAD() {
    try {
        const { error } = await supabase.from("stores").select("id").limit(1);

        if (error) {
            return new NextResponse(null, {
                status: 503,
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                    "X-Health-Check": "FAIL",
                },
            });
        }

        return new NextResponse(null, {
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "X-Health-Check": "OK",
            },
        });
    } catch (err) {
        return new NextResponse(null, {
            status: 500,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "X-Health-Check": "ERROR",
            },
        });
    }
}

/**
 * GET /api/health
 * Optional JSON response endpoint for monitoring tools.
 */
export async function GET() {
    const startTime = Date.now();
    try {
        const { error } = await supabase.from("stores").select("id").limit(1);
        const latencyMs = Date.now() - startTime;

        if (error) {
            return NextResponse.json(
                {
                    status: "error",
                    database: "disconnected",
                    error: error.message,
                    timestamp: new Date().toISOString(),
                },
                {
                    status: 503,
                    headers: {
                        "Cache-Control": "no-store, no-cache, must-revalidate",
                    },
                }
            );
        }

        return NextResponse.json(
            {
                status: "ok",
                database: "connected",
                latencyMs,
                timestamp: new Date().toISOString(),
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                },
            }
        );
    } catch (err: any) {
        return NextResponse.json(
            {
                status: "error",
                database: "error",
                error: err?.message || "Internal server error",
                timestamp: new Date().toISOString(),
            },
            {
                status: 500,
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                },
            }
        );
    }
}
