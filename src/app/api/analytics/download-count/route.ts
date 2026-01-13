import { NextResponse, NextRequest } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';

// Note: This implementation uses the Google Analytics Data API (GA4).
// It requires:
// 1. @google-analytics/data installed
// 2. A service account with GA4 read permissions configured via credentials JSON
// 3. GA4_PROPERTY_ID environment variable set to your GA4 property ID

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}'
  ),
});

const getHandler: AuthenticatedApiHandler = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get('fileName');
  const fileType = searchParams.get('fileType');
  const resourceType = searchParams.get('resourceType');
  const bannerAnalyticsId = searchParams.get('banner_analytics_id');

  if (!fileName) {
    return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
  }

  try {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const propertyId = process.env.GA4_PROPERTY_ID;
    
    if (!measurementId) {
      console.error('NEXT_PUBLIC_GA_MEASUREMENT_ID not configured');
      return NextResponse.json({ error: 'Analytics not configured' }, { status: 500 });
    }

    if (!propertyId) {
      console.error('GA4_PROPERTY_ID not configured');
      return NextResponse.json({ error: 'Analytics property not configured' }, { status: 500 });
    }

    if (!bannerAnalyticsId) {
      console.error('banner_analytics_id is required to fetch download count');
      return NextResponse.json({ error: 'banner_analytics_id is required' }, { status: 400 });
    }

    const bannerId = bannerAnalyticsId as string;

    const property = propertyId.startsWith('properties/')
      ? propertyId
      : `properties/${propertyId}`;

    const [report] = await analyticsDataClient.runReport({
      property,
      dateRanges: [{ startDate: '2025-11-11', endDate: 'today' }],
      dimensions: [
        { name: 'eventName' },
        { name: 'customEvent:banner_analytics_id' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'resource_file_download',
                },
              },
            },
            {
              filter: {
                fieldName: 'customEvent:banner_analytics_id',
                stringFilter: {
                  matchType: 'EXACT',
                  value: bannerId,
                },
              },
            },
          ],
        },
      },
    });

    let count = 0;
    if (report.rows && report.rows.length > 0) {
      const metricValue = report.rows[0].metricValues?.[0]?.value;
      if (metricValue !== undefined) {
        const parsed = parseInt(metricValue || '0', 10);
        if (!Number.isNaN(parsed)) {
          count = parsed;
        }
      }
    }

    return NextResponse.json({ 
      count,
      fileName,
      fileType,
      resourceType,
      bannerAnalyticsId,
      source: 'ga4_data_api'
    });

  } catch (error) {
    console.error('Error fetching download count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download count' },
      { status: 500 }
    );
  }
};

export const GET = withAuth(getHandler);
