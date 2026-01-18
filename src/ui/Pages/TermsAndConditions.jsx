import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Breadcrumbs } from '../components/Breadcrumbs';

const TermsAndConditions = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
        <div className={`prose max-w-none ${isRTL ? 'prose-rtl' : ''}`}>
          {isRTL ? (
            <div className="space-y-6 text-right">
              <h2 className="text-xl font-bold">
                شروط الاستخدام والموافقة المُعلَمة
              </h2>

              <section>
                <h3 className="text-lg font-semibold">
                  أولاً: التعريف بالأطراف
                </h3>
                <ol className="list-decimal pr-6 space-y-2">
                  <li>
                    الطرف الأول: شركة Lumina®، شركة متخصصة بتصميم وتصنيع
                    الراصفات التقويمية الشفافة والملحقات المرتبطة بها، ويشار
                    إليها لاحقاً بـ "الشركة".
                  </li>
                  <li>
                    الطرف الثاني: طبيب الأسنان / طبيب تقويم الأسنان المرخّص
                    أصولاً، ويشار إليه لاحقاً بـ "الطبيب".
                  </li>
                </ol>
                <p className="mt-2">ويُشار إلى الطرفين مجتمعين بـ "الطرفين".</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold">ثانياً: نطاق العلاقة</h3>
                <ol className="list-decimal pr-6 space-y-2">
                  <li>
                    تقوم الشركة بتقديم خدمات تصميم وتصنيع الراصفات الشفافة بناءً
                    على البيانات والمعلومات التي يزوّدها الطبيب.
                  </li>
                  <li>
                    الطبيب هو الجهة الطبية الوحيدة المسؤولة عن التشخيص، وضع
                    الخطة العلاجية، المتابعة السريرية، واتخاذ القرارات العلاجية.
                  </li>
                  <li>
                    هذه العلاقة لا تُنشئ شراكة أو وكالة أو علاقة عمل بين
                    الطرفين، وإنما علاقة مهنية تعاقدية مستقلة.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  ثالثاً: التزامات الطبيب
                </h3>
                <p className="mb-2">يقرّ الطبيب ويتعهد بما يلي:</p>
                <ol className="list-decimal pr-6 space-y-2">
                  <li>
                    تزويد الشركة ببيانات دقيقة وصحيحة (صور، طبعات، ملفات رقمية،
                    معلومات سريرية).
                  </li>
                  <li>
                    التأكد من أن الحالة مناسبة للعلاج بالراصفات الشفافة قبل
                    الإرسال.
                  </li>
                  <li>
                    شرح الخطة العلاجية للمريض والحصول على موافقته المُعلَمة.
                  </li>
                  <li>
                    متابعة الحالة سريرياً بشكل منتظم، وعدم الاعتماد على التصميم
                    الرقمي وحده.
                  </li>
                  <li>
                    الالتزام بتعليمات استخدام الراصفات وتسليمها للمريض بشكل
                    صحيح.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  رابعاً: التزامات الشركة
                </h3>
                <p className="mb-2">تتعهد الشركة بما يلي:</p>
                <ol className="list-decimal pr-6 space-y-2">
                  <li>
                    تصنيع الراصفات وفق المعايير الفنية المتعارف عليها وبناءً على
                    المعطيات المقدّمة.
                  </li>
                  <li>
                    تقديم تصميم علاجي رقمي يعكس الخطة المقترحة، مع إمكانية
                    التعديل بعد مراجعة الطبيب.
                  </li>
                  <li>
                    الحفاظ على سرية بيانات المرضى وعدم استخدامها لأي غرض غير
                    علاجي أو تقني.
                  </li>
                  <li>
                    إعلام الطبيب بأي ملاحظات تقنية قد تؤثر على إمكانية تنفيذ
                    الحالة.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  خامساً: حدود المسؤولية
                </h3>
                <ol className="list-decimal pr-6 space-y-2">
                  <li>
                    يقرّ الطرفان أن النتيجة العلاجية تعتمد على عوامل متعددة
                    (التزام المريض، التشخيص، المتابعة السريرية، العوامل
                    البيولوجية).
                  </li>
                  <li>
                    لا تتحمل الشركة أي مسؤولية عن:
                    <ul className="list-disc pr-6 mt-2 space-y-1">
                      <li>سوء التشخيص</li>
                      <li>ضعف التزام المريض</li>
                      <li>قرارات علاجية غير مناسبة</li>
                    </ul>
                  </li>
                  <li>
                    الشركة غير مسؤولة عن أي مضاعفات سريرية أو نتائج غير متوقعة.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  سادساً: التعديلات وإعادة التصنيع
                </h3>
                <ol className="list-decimal pr-6 space-y-2">
                  <li>
                    تخضع أي تعديلات أو إعادة تصنيع لسياسة الشركة المعتمدة
                    والمعلنة.
                  </li>
                  <li>
                    يتحمل الطبيب مسؤولية التأكد من دقة البيانات قبل التصنيع
                    الأولي.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  سابعاً: السرية والملكية الفكرية
                </h3>
                <ol className="list-decimal pr-6 space-y-2">
                  <li>جميع التصاميم والملفات الرقمية هي ملك للشركة.</li>
                  <li>
                    يلتزم الطبيب بعدم مشاركة أو إعادة استخدام أي مواد تقنية أو
                    تصاميم دون إذن خطي.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">ثامناً: إنهاء العلاقة</h3>
                <ol className="list-decimal pr-6 space-y-2">
                  <li>
                    يحق لأي طرف إنهاء التعامل في أي وقت مع الالتزام بالطلبات
                    الجارية.
                  </li>
                  <li>
                    لا يترتب على الإنهاء أي التزامات مالية إضافية خارج المتفق
                    عليه.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">تاسعاً: أحكام عامة</h3>
                <ol className="list-decimal pr-6 space-y-2">
                  <li>
                    يخضع هذا الاتفاق للقوانين النافذة في الجمهورية العربية
                    السورية.
                  </li>
                  <li>
                    أي نزاع يُحل ودياً، وفي حال تعذّر ذلك يتم اللجوء للجهات
                    المختصة.
                  </li>
                  <li>
                    تعتبر الموافقة الإلكترونية إقراراً بالموافقة الكاملة على
                    جميع البنود.
                  </li>
                </ol>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">
                Terms of Use and Informed Consent
              </h2>

              <section>
                <h3 className="text-lg font-semibold">
                  First: Definition of Parties
                </h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    First Party: Lumina® Company, a company specialized in
                    designing and manufacturing clear orthodontic aligners and
                    related accessories, hereinafter referred to as "the
                    Company".
                  </li>
                  <li>
                    Second Party: Licensed Dentist / Orthodontist, hereinafter
                    referred to as "the Doctor".
                  </li>
                </ol>
                <p className="mt-2">
                  Both parties together are referred to as "the Parties".
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  Second: Scope of Relationship
                </h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    The Company provides design and manufacturing services for
                    clear aligners based on data and information provided by the
                    Doctor.
                  </li>
                  <li>
                    The Doctor is the sole medical entity responsible for
                    diagnosis, treatment planning, clinical follow-up, and
                    treatment decisions.
                  </li>
                  <li>
                    This relationship does not create a partnership, agency, or
                    employment relationship between the parties, but rather an
                    independent professional contractual relationship.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  Third: Doctor's Obligations
                </h3>
                <p className="mb-2">
                  The Doctor acknowledges and commits to the following:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    Providing the Company with accurate and correct data
                    (images, impressions, digital files, clinical information).
                  </li>
                  <li>
                    Ensuring the case is suitable for clear aligner treatment
                    before submission.
                  </li>
                  <li>
                    Explaining the treatment plan to the patient and obtaining
                    informed consent.
                  </li>
                  <li>
                    Regularly following up the case clinically and not relying
                    solely on digital design.
                  </li>
                  <li>
                    Following aligner usage instructions and delivering them
                    correctly to the patient.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  Fourth: Company's Obligations
                </h3>
                <p className="mb-2">The Company commits to the following:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    Manufacturing aligners according to recognized technical
                    standards based on provided data.
                  </li>
                  <li>
                    Providing a digital treatment design reflecting the proposed
                    plan, with possibility of modification after Doctor's
                    review.
                  </li>
                  <li>
                    Maintaining patient data confidentiality and not using it
                    for any non-therapeutic or technical purpose.
                  </li>
                  <li>
                    Informing the Doctor of any technical observations that may
                    affect case implementation.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  Fifth: Liability Limitations
                </h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    The Parties acknowledge that treatment outcome depends on
                    multiple factors (patient compliance, diagnosis, clinical
                    follow-up, biological factors).
                  </li>
                  <li>
                    The Company bears no responsibility for:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Misdiagnosis</li>
                      <li>Poor patient compliance</li>
                      <li>Inappropriate treatment decisions</li>
                    </ul>
                  </li>
                  <li>
                    The Company is not responsible for any clinical
                    complications or unexpected results.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  Sixth: Modifications and Remanufacturing
                </h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    Any modifications or remanufacturing are subject to the
                    Company's approved and announced policy.
                  </li>
                  <li>
                    The Doctor bears responsibility for ensuring data accuracy
                    before initial manufacturing.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  Seventh: Confidentiality and Intellectual Property
                </h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    All designs and digital files are property of the Company.
                  </li>
                  <li>
                    The Doctor commits not to share or reuse any technical
                    materials or designs without written permission.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  Eighth: Termination of Relationship
                </h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    Either party may terminate dealings at any time with
                    commitment to ongoing orders.
                  </li>
                  <li>
                    Termination does not result in any additional financial
                    obligations beyond what was agreed upon.
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold">
                  Ninth: General Provisions
                </h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    This agreement is subject to the laws in force in the Syrian
                    Arab Republic.
                  </li>
                  <li>
                    Any dispute shall be resolved amicably, and if not possible,
                    resort to competent authorities.
                  </li>
                  <li>
                    Electronic approval is considered an acknowledgment of full
                    agreement to all terms.
                  </li>
                </ol>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
