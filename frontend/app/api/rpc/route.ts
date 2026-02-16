/**
 * RPC Proxy API Route
 * 
 * Proxies RPC requests to avoid CORS issues with public RPC endpoints.
 * Supports both Sepolia and Mainnet networks.
 */

import { NextRequest, NextResponse } from 'next/server'

const RPC_URLS = {
  sepolia: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
  mainnet: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
}

export async function POST(request: NextRequest) {
  try {
    // Get network from query params or default to sepolia
    const { searchParams } = new URL(request.url)
    const network = (searchParams.get('network') || 'sepolia') as 'sepolia' | 'mainnet'
    
    // Get RPC URL for the network
    const rpcUrl = RPC_URLS[network]
    
    if (!rpcUrl) {
      return NextResponse.json(
        { error: `RPC URL not configured for network: ${network}` },
        { status: 500 }
      )
    }
    
    // Get request body
    const body = await request.json()
    
    // Forward request to RPC endpoint
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    // Get response data
    const data = await response.json()
    
    // Return response with CORS headers
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('RPC proxy error:', error)
    return NextResponse.json(
      { error: 'RPC request failed' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
