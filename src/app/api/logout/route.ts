import { NextResponse } from "next/server";

export function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  response.cookies.set("session_user", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
