import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore, Subject } from '../state/appStore';

/**
 * SemesterSetupWizard - First-run onboarding for students
 * 
 * Collects subjects, exam dates, and preferences.
 * Creates baseline data for the recommendation engine.
 */

type WizardStep = 'welcome' | 'subjects' | 'exams' | 'schedule' | 'complete';

const SUBJECT_COLORS = [
  '#ff6b35', // Orange (accent)
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

const SemesterSetupWizard = () => {
  const { setSetupCompleted, setShowSetupWizard, loadAllData } = useAppStore();
  
  const [step, setStep] = useState<WizardStep>('welcome');
  const [subjects, setSubjects] = useState<Omit<Subject, 'id'>[]>([]);
  const [exams, setExams] = useState<{ subject_index: number; title: string; date: string }[]>([]);
  const [studyHoursPerWeek, setStudyHoursPerWeek] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subject form state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCredits, setNewSubjectCredits] = useState<number | ''>('');

  // Exam form state
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamSubject, setNewExamSubject] = useState(0);

  const addSubject = () => {
    if (!newSubjectName.trim()) return;
    
    setSubjects([...subjects, {
      name: newSubjectName.trim(),
      color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length],
      semester: 'current',
      credits: newSubjectCredits || undefined,
    }]);
    setNewSubjectName('');
    setNewSubjectCredits('');
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
    // Remove associated exams
    setExams(exams.filter(e => e.subject_index !== index));
  };

  const addExam = () => {
    if (!newExamTitle.trim() || !newExamDate || subjects.length === 0) return;
    
    setExams([...exams, {
      subject_index: newExamSubject,
      title: newExamTitle.trim(),
      date: newExamDate,
    }]);
    setNewExamTitle('');
    setNewExamDate('');
  };

  const removeExam = (index: number) => {
    setExams(exams.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Save subjects to database
      const savedSubjects: Subject[] = [];
      for (const subject of subjects) {
        const result = await invoke<Subject[]>('add_subject', { subject: { ...subject, id: 0 } });
        if (result.length > 0) {
          savedSubjects.push(result[result.length - 1]);
        }
      }
      
      // Save exams with correct subject IDs
      for (const exam of exams) {
        const subjectId = savedSubjects[exam.subject_index]?.id;
        if (subjectId) {
          await invoke('add_exam', { 
            exam: {
              id: 0,
              subject_id: subjectId,
              title: exam.title,
              exam_date: exam.date,
              weight: null,
              notes: null,
            }
          });
        }
      }
      
      // Save study hours preference
      await invoke('set_app_setting', { 
        key: 'weekly_study_hours', 
        value: studyHoursPerWeek.toString() 
      });
      
      // Mark setup as complete
      await invoke('set_app_setting', { key: 'setup_completed', value: 'true' });
      
      setSetupCompleted(true);
      setShowSetupWizard(false);
      
      // Reload all data
      await loadAllData();
      
    } catch (error) {
      console.error('Failed to save setup data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setSetupCompleted(true);
    setShowSetupWizard(false);
  };

  const nextStep = () => {
    switch (step) {
      case 'welcome': setStep('subjects'); break;
      case 'subjects': setStep('exams'); break;
      case 'exams': setStep('schedule'); break;
      case 'schedule': setStep('complete'); break;
    }
  };

  const prevStep = () => {
    switch (step) {
      case 'subjects': setStep('welcome'); break;
      case 'exams': setStep('subjects'); break;
      case 'schedule': setStep('exams'); break;
      case 'complete': setStep('schedule'); break;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div 
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Progress Indicator */}
        <div className="px-6 pt-6">
          <div className="flex items-center gap-2 mb-6">
            {['welcome', 'subjects', 'exams', 'schedule', 'complete'].map((s, i) => (
              <div 
                key={s}
                className="flex-1 h-1 rounded-full transition-colors"
                style={{ 
                  backgroundColor: i <= ['welcome', 'subjects', 'exams', 'schedule', 'complete'].indexOf(step) 
                    ? 'var(--accent)' 
                    : 'var(--border-color)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 pb-6">
          
          {/* Welcome Step */}
          {step === 'welcome' && (
            <div className="text-center py-8">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <span className="text-3xl font-bold text-black">Z</span>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Welcome to ZenTrack
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Let's set up your semester in 2 minutes.
                <br />
                This helps us give you better recommendations.
              </p>
              <div className="space-y-3">
                <button 
                  className="btn btn-primary w-full"
                  onClick={nextStep}
                >
                  Get Started
                </button>
                <button 
                  className="btn btn-secondary w-full"
                  onClick={handleSkip}
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Subjects Step */}
          {step === 'subjects' && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                What are you studying?
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Add your current subjects or courses
              </p>

              {/* Add Subject Form */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Subject name (e.g., Calculus)"
                  className="input flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addSubject()}
                />
                <input
                  type="number"
                  value={newSubjectCredits}
                  onChange={(e) => setNewSubjectCredits(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Credits"
                  className="input w-20"
                  min={1}
                  max={10}
                />
                <button 
                  className="btn btn-primary"
                  onClick={addSubject}
                >
                  Add
                </button>
              </div>

              {/* Subject List */}
              <div className="space-y-2 max-h-48 overflow-y-auto mb-6">
                {subjects.length === 0 && (
                  <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                    No subjects added yet
                  </p>
                )}
                {subjects.map((subject, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span style={{ color: 'var(--text-primary)' }}>{subject.name}</span>
                      {subject.credits && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {subject.credits} cr
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => removeSubject(index)}
                      className="p-1 rounded hover:bg-gray-700"
                    >
                      <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <button className="btn btn-secondary" onClick={prevStep}>Back</button>
                <button 
                  className="btn btn-primary flex-1" 
                  onClick={nextStep}
                  disabled={subjects.length === 0}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Exams Step */}
          {step === 'exams' && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                When are your exams?
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Add upcoming exams for your subjects
              </p>

              {/* Add Exam Form */}
              <div className="space-y-2 mb-4">
                <div className="flex gap-2">
                  <select
                    value={newExamSubject}
                    onChange={(e) => setNewExamSubject(parseInt(e.target.value))}
                    className="input"
                  >
                    {subjects.map((subject, index) => (
                      <option key={index} value={index}>{subject.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newExamTitle}
                    onChange={(e) => setNewExamTitle(e.target.value)}
                    placeholder="Exam title (e.g., Midterm)"
                    className="input flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="input flex-1"
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={addExam}
                    disabled={!newExamTitle || !newExamDate}
                  >
                    Add Exam
                  </button>
                </div>
              </div>

              {/* Exam List */}
              <div className="space-y-2 max-h-48 overflow-y-auto mb-6">
                {exams.length === 0 && (
                  <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                    No exams added yet (optional)
                  </p>
                )}
                {exams.map((exam, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subjects[exam.subject_index]?.color }}
                      />
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{exam.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {subjects[exam.subject_index]?.name} • {new Date(exam.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeExam(index)}
                      className="p-1 rounded hover:bg-gray-700"
                    >
                      <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <button className="btn btn-secondary" onClick={prevStep}>Back</button>
                <button className="btn btn-primary flex-1" onClick={nextStep}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Schedule Step */}
          {step === 'schedule' && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Weekly study goal
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                How many hours do you want to study per week?
              </p>

              <div className="py-8">
                <div className="text-center mb-4">
                  <span 
                    className="text-5xl font-bold"
                    style={{ color: 'var(--accent)' }}
                  >
                    {studyHoursPerWeek}
                  </span>
                  <span className="text-xl ml-2" style={{ color: 'var(--text-muted)' }}>hours/week</span>
                </div>

                <input
                  type="range"
                  min={5}
                  max={50}
                  value={studyHoursPerWeek}
                  onChange={(e) => setStudyHoursPerWeek(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ backgroundColor: 'var(--border-color)' }}
                />

                <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  <span>5h</span>
                  <span>~{Math.round(studyHoursPerWeek / 7 * 10) / 10}h/day</span>
                  <span>50h</span>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <button className="btn btn-secondary" onClick={prevStep}>Back</button>
                <button className="btn btn-primary flex-1" onClick={nextStep}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
              >
                <svg className="w-8 h-8" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                You're all set!
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {subjects.length} subject{subjects.length !== 1 ? 's' : ''} • 
                {exams.length} exam{exams.length !== 1 ? 's' : ''} • 
                {studyHoursPerWeek}h/week goal
              </p>

              <button 
                className="btn btn-primary w-full"
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Setting up...' : 'Start Using ZenTrack'}
              </button>

              <button 
                className="btn btn-secondary w-full mt-3"
                onClick={prevStep}
                disabled={isSubmitting}
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SemesterSetupWizard;
