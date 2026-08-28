import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Clock, Laptop, MapPin, ShoppingCart } from 'lucide-react';
import type { CourseDeliveryMode, CourseDto } from '@forge-loom/shared-types';
import { useCatalog, useEnroll, useMyEnrollments } from '../../features/student/hooks';
import { useAuth } from '../../auth/AuthContext';
import { ApiClientError } from '../../lib/apiClient';
import { RazorpayDismissedError } from '../../lib/razorpay';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { PageLoading } from '../../components/ui/PageLoading';
import { Modal } from '../../components/ui/Modal';

type FilterValue = 'all' | CourseDeliveryMode;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All Courses' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
];

const CARD_ACCENTS = [
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-violet-500 to-violet-700',
  'from-orange-400 to-orange-600',
  'from-teal-500 to-teal-700',
  'from-pink-500 to-pink-700',
];

export function CatalogPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterValue>('all');
  const { data: page, isLoading: catalogLoading } = useCatalog(
    filter === 'all' ? undefined : filter
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useMyEnrollments();
  const enroll = useEnroll();

  const [checkoutCourse, setCheckoutCourse] = useState<CourseDto | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const enrolledCourseIds = useMemo(
    () =>
      new Set(
        (enrollments ?? [])
          .filter((e) => e.status === 'active' || e.status === 'completed')
          .map((e) => e.courseId)
      ),
    [enrollments]
  );

  if (catalogLoading || enrollmentsLoading) {
    return <PageLoading />;
  }

  function openCheckout(course: CourseDto) {
    setCheckoutCourse(course);
    setCheckoutError(null);
    setCheckoutSuccess(false);
  }

  function closeCheckout() {
    setCheckoutCourse(null);
  }

  async function confirmPurchase() {
    if (!checkoutCourse) return;
    setCheckoutError(null);
    try {
      await enroll.mutateAsync({
        courseId: checkoutCourse.id,
        courseTitle: checkoutCourse.title,
        userEmail: user?.email,
      });
      setCheckoutSuccess(true);
    } catch (err) {
      if (err instanceof RazorpayDismissedError) {
        setCheckoutError('Payment window closed — you can try again whenever you’re ready.');
      } else {
        setCheckoutError(
          err instanceof ApiClientError ? err.message : 'Purchase failed. Please try again.'
        );
      }
    }
  }

  const courses = page?.courses ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Browse Courses</h1>
        <p className="text-sm text-slate-500">Find your next course and start learning today.</p>
      </div>

      <div className="mb-6">
        <Tabs tabs={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {courses.length === 0 && (
        <Card>
          <p className="py-8 text-center text-sm text-slate-400">
            No published courses yet — check back soon.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course, index) => {
          const isEnrolled = enrolledCourseIds.has(course.id);
          const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
          return (
            <Card key={course.id} className="flex flex-col overflow-hidden p-0">
              <div className={`flex h-20 items-end bg-gradient-to-br p-4 ${accent}`}>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                  {course.deliveryMode === 'online' ? <Laptop size={12} /> : <MapPin size={12} />}
                  {course.deliveryMode === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="mb-1 font-semibold text-slate-900">{course.title}</h3>
                <p className="mb-4 line-clamp-2 flex-1 text-sm text-slate-500">
                  {course.description || 'No description provided.'}
                </p>
                <div className="mb-4 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {course.durationDays}d · {course.durationHours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={13} /> {course.syllabus.length} syllabus days
                  </span>
                </div>
                <div className="mb-4">
                  <span className="text-lg font-bold text-slate-900">
                    {course.currency} {course.price}
                  </span>
                </div>
                {isEnrolled ? (
                  <Link to="/student/courses">
                    <Button variant="secondary" className="w-full">
                      Go to Course
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full" onClick={() => openCheckout(course)}>
                    <ShoppingCart size={15} /> Enroll Now
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={Boolean(checkoutCourse)} onClose={closeCheckout}>
        {checkoutCourse && !checkoutSuccess && (
          <>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Confirm Purchase</h2>
            <p className="mb-4 text-sm text-slate-500">Review your order before confirming.</p>
            <div className="mb-4 rounded-xl border border-slate-200 p-4">
              <p className="font-medium text-slate-900">{checkoutCourse.title}</p>
              <p className="mb-3 text-xs text-slate-500">
                {checkoutCourse.deliveryMode} · {checkoutCourse.durationDays} days ·{' '}
                {checkoutCourse.durationHours} hours
              </p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">Total</span>
                <span className="font-semibold text-slate-900">
                  {checkoutCourse.currency} {checkoutCourse.price}
                </span>
              </div>
            </div>
            {checkoutError && <p className="mb-3 text-sm text-red-600">{checkoutError}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={closeCheckout}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={confirmPurchase} disabled={enroll.isPending}>
                {enroll.isPending ? 'Processing…' : 'Confirm Purchase'}
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              Test payment via Razorpay — card 4111 1111 1111 1111, any future expiry, any CVV. No
              real money moves.
            </p>
          </>
        )}
        {checkoutCourse && checkoutSuccess && (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">You&apos;re enrolled!</h2>
            <p className="mb-4 text-sm text-slate-500">
              {checkoutCourse.title} is now in your courses.
            </p>
            <Link to="/student/courses">
              <Button className="w-full" onClick={closeCheckout}>
                Go to My Courses
              </Button>
            </Link>
          </div>
        )}
      </Modal>
    </div>
  );
}
