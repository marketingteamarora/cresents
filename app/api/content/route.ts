import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { defaultContent } from "@/lib/default-content"

// Revalidate every 60 seconds
export const revalidate = 60

export async function GET() {
  console.log("Fetching content from Supabase...")
  
  try {
    // First, verify the Supabase client is initialized
    if (!supabaseServer) {
      console.error("Supabase client not initialized")
      throw new Error("Supabase client not initialized")
    }

    console.log("Supabase client initialized, making query...")
    
    // Fetch the latest active content from Supabase using the server client
    const { data, error } = await supabaseServer
      .from("landing_page_content")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .throwOnError()
      
    console.log("Supabase query completed. Data:", data, "Error:", error)

    console.log("Supabase query completed. Data:", data, "Error:", error)

    if (error) {
      console.error("Error fetching content:", error)
      // Return default content if there's an error
      const errorResponse = {
        ...defaultContent,
        _debug: {
          error: 'Failed to fetch content from database',
          details: String(error)
        }
      }
      
      console.error("Error response:", errorResponse)
      return NextResponse.json(errorResponse,
        { 
          status: 200,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Content-Type": "application/json"
          },
        }
      )
    }

    // If no data found, return default content with 404 status
    if (!data) {
      console.log("No active content found, returning default content")
      return NextResponse.json(
        { 
          ...defaultContent,
          _debug: { 
            message: "No active content found in database",
            timestamp: new Date().toISOString()
          }
        },
        { 
          status: 200, // Still 200 to prevent client-side errors
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Content-Type": "application/json"
          },
        }
      )
    }

    console.log("Content found, returning data")
    
    // Return the content from the database
    return NextResponse.json(
      data.content,
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Content-Type": "application/json"
        },
      }
    )
  } catch (error) {
    console.error("API error:", error)
    
    // Return default content with error details
    return NextResponse.json(
      { 
        ...defaultContent,
        _debug: { 
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : "UnknownError"
        }
      },
      { 
        status: 200, // Still return 200 to prevent client-side errors
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Content-Type": "application/json"
        },
      }
    )
  }
}
