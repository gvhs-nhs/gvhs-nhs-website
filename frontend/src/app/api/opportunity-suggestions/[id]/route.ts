import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    // Validate status
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, approved, or rejected' },
        { status: 400 }
      );
    }

    // Update suggestion status
    const { data, error } = await supabaseAdmin
      .from('opportunity_suggestions')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating opportunity suggestion status:', error);
      return NextResponse.json(
        { error: 'Failed to update suggestion status' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Suggestion status updated successfully',
      suggestion: data
    });

  } catch (error) {
    console.error('Error in opportunity suggestion PATCH API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('opportunity_suggestions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting opportunity suggestion:', error);
      return NextResponse.json(
        { error: 'Failed to delete suggestion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Suggestion deleted successfully'
    });

  } catch (error) {
    console.error('Error in opportunity suggestion DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}