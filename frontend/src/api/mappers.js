export function mapInterviewer(row) {
  const slots = Array.isArray(row.slots) ? row.slots.filter(Boolean) : JSON.parse(row.slots || '[]').filter(Boolean);
  const skills = row.skills ? row.skills.split(',').map((skill) => skill.trim()) : [];
  const interviewTypes = row.interview_type ? row.interview_type.split(',').map((type) => type.trim()) : [];

  return {
    id: row.id,
    name: row.name,
    role: row.interview_type || 'Interviewer',
    domain: row.domain,
    interviewTypes,
    experienceLevel: 'Senior',
    skills,
    badges: skills,
    rating: Number(row.rating || 0),
    price: 45,
    slots,
  };
}

export function mapBooking(row) {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    interviewerId: row.interviewer_id,
    candidate: row.candidate_name,
    interviewer: row.interviewer_name,
    challenge: row.challenge || row.domain || 'Interview session',
    date: row.booking_date?.replace('T', ' ').slice(0, 16),
    status: row.status,
    paymentStatus: 'Paid',
    calendarStatus: row.meeting_link ? 'Synced' : 'Pending',
    submission: row.submission_file_name || '',
    evaluation: row.evaluation_feedback || '',
    score: row.evaluation_score || '',
  };
}
