import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ShowView } from "@/components/refine-ui/views/show-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-separator";
import { useBack, useGetIdentity } from "@refinedev/core";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Trophy, AlertCircle } from "lucide-react";
import { BACKEND_BASE_URL } from "@/constants";
import { QuizQuestion } from "@/types";

type AnswerMap = Record<number, string>;

type AnalysisResult = {
  overallFeedback: string;
  scoreLabel: string;
  questionFeedback: Record<number, string>;
  attemptId?: number;
};

type UserAttempt = {
  id: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  answers: AnswerMap;
  analysis: AnalysisResult | null;
  createdAt: string;
};

type QuizData = {
  id: number;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  numQuestions: number;
  questions: QuizQuestion[];
  subject: { id: number; name: string } | null;
  userAttempt: UserAttempt | null;
  totals: { attempts: number };
};

const difficultyVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  easy: "secondary",
  medium: "default",
  hard: "destructive",
};

const scoreLabelVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Excellent: "default",
  Good: "secondary",
  Average: "outline",
  "Needs Improvement": "destructive",
  Poor: "destructive",
};

const ResultsCard = ({
  score,
  correct,
  total,
  analysis,
  analysisLoading,
  analysisError,
}: {
  score: number;
  correct: number;
  total: number;
  analysis: AnalysisResult | null;
  analysisLoading?: boolean;
  analysisError?: string | null;
}) => (
  <Card className="my-6 border-primary/20 bg-primary/5">
    <CardContent className="pt-6">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
          <Trophy className="w-9 h-9 text-primary" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-3xl font-bold">{score}%</p>
          <p className="text-muted-foreground text-sm mt-1">
            {correct} / {total} correct
          </p>
        </div>
      </div>
 
      <Separator className="my-4" />
 
      <div>
        <p className="text-sm font-semibold mb-2">AI Analysis</p>
        {analysisLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating ❇️ analysis...
          </div>
        )}
        {analysisError && (
          <p className="text-destructive text-sm">{analysisError}</p>
        )}
        {analysis && (
          <div className="space-y-1">
            <Badge
              variant={scoreLabelVariant[analysis.scoreLabel] ?? "outline"}
              className="mb-2"
            >
              {analysis.scoreLabel}
            </Badge>
            <p className="text-sm text-muted-foreground">{analysis.overallFeedback}</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const QuizzesShow = () => {
  const { id } = useParams<{ id: string }>();
  const back = useBack();
  const { data: identity } = useGetIdentity<{ id: string }>();
  const userId = identity?.id;

  const [quiz, setQuiz]               = useState<QuizData | null>(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizError, setQuizError]     = useState(false);
 
  useEffect(() => {
    if (!id || !userId) return;
 
    setQuizLoading(true);
    setQuizError(false);
 
    fetch(`${BACKEND_BASE_URL}quizzes/${id}?userId=${encodeURIComponent(userId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        // Refine-style backend wraps in { data: ... }
        setQuiz(json.data ?? json);
      })
      .catch(() => setQuizError(true))
      .finally(() => setQuizLoading(false));
  }, [id, userId]);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);


  const questions: QuizQuestion[] = quiz?.questions ?? [];
  const userAttempt: UserAttempt | null = quiz?.userAttempt ?? null;
  const alreadyAttempted = !!userAttempt;

  const handleSelect = (questionIndex: number, option: string) => {
    if (submitted || alreadyAttempted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmit = async () => {
    if (!quiz || !userId) return;

    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    const calculatedScore = Math.round((correct / questions.length) * 100);

    setScore(calculatedScore);
    setCorrectCount(correct);
    setSubmitted(true);
    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const res = await fetch(`${BACKEND_BASE_URL}quizzes/${quiz.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          score: calculatedScore,
          correct,
          total: questions.length,
          userId,
        }),
      });

      const result = await res.json();
      if (res.status === 409) {
        setAnalysis(result.analysis);
        return;
      }

      if (!res.ok) throw new Error("Analysis failed");
      setAnalysis(result);
    } catch (e) {
      console.error("analysis failed", e);
      setAnalysisError("Could not load AI analysis. Please try again.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  if (!userId || quizLoading) {
    return (
      <ShowView>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
        </div>
      </ShowView>
    );
  }

  if (quizError || !quiz) {
    return (
      <ShowView>
        <p className="text-destructive py-10">Failed to load quiz. Please try again.</p>
      </ShowView>
    );
  }
 
  const displayAnswers   = alreadyAttempted ? userAttempt!.answers     : answers;
  const displayScore     = alreadyAttempted ? userAttempt!.score       : score;
  const displayCorrect   = alreadyAttempted ? userAttempt!.correctCount : correctCount;
  const displayTotal     = alreadyAttempted ? userAttempt!.totalQuestions : questions.length;
  const displayAnalysis  = alreadyAttempted ? userAttempt!.analysis    : analysis;
  const showResults      = alreadyAttempted || submitted;

  return (
    <ShowView className="class-view">
      <Breadcrumb />

      <h1 className="page-title">{quiz.topic}</h1>
      <div className="intro-row">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">{quiz.subject?.name}</Badge>
          <Badge variant={difficultyVariant[quiz.difficulty] ?? "default"}>
            {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
          </Badge>
          <Badge variant="outline">{questions.length} Questions</Badge>
          {alreadyAttempted && (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              ✓ Attempted
            </Badge>
          )}
        </div>
        <Button onClick={() => back()}>Go Back</Button>
      </div>

      <Separator />

      {/* Already attempted banner */}
      {alreadyAttempted && (
        <div className="flex items-start gap-3 mt-6 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            You already attempted this quiz on {new Date(userAttempt!.createdAt).toLocaleDateString()}. 
            Your previous results are shown below. Each quiz can only be attempted once.
          </span>
        </div>
      )}
 
      {/* Score + Analysis card */}
      {showResults && displayScore !== null && (
        <ResultsCard
          score={displayScore}
          correct={displayCorrect}
          total={displayTotal}
          analysis={displayAnalysis}
          analysisLoading={analysisLoading}
          analysisError={analysisError}
        />
      )}

      {/* Questions */}
      <div className="space-y-6 mt-6">
        {questions.map((question, qIndex) => {
          const selectedAnswer = displayAnswers[qIndex];
          const isCorrect = showResults && selectedAnswer === question.correctAnswer;
          const isWrong = showResults && !!selectedAnswer && selectedAnswer !== question.correctAnswer;

          return (
            <Card
              key={qIndex}
              className={
                showResults
                  ? isCorrect
                    ? "border-green-500/30 bg-green-500/5"
                    : isWrong
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-muted"
                  : "border-muted"
              }
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-start gap-2">
                  <span className="shrink-0 text-muted-foreground">Q{qIndex + 1}.</span>
                  <span>{question.question}</span>
                  {showResults && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 ml-auto" />
                  )}
                  {showResults && isWrong && (
                    <XCircle className="w-5 h-5 text-destructive shrink-0 ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {question.options.map((option, oIndex) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectOption = showResults && option === question.correctAnswer;

                  let optionClass =
                    "flex items-center gap-3 px-4 py-2.5 rounded-md border cursor-pointer text-sm transition-colors";

                  if (!showResults) {
                    optionClass += isSelected
                      ? " border-blue-500 bg-blue-500/10 text-blue-700"
                      : " border-muted hover:border-primary/50 hover:bg-accent";
                  } else {
                    if (isCorrectOption) {
                      optionClass += " border-green-500 bg-green-500/10 text-green-700 cursor-default";
                    } else if (isSelected && !isCorrectOption) {
                      optionClass += " border-destructive bg-destructive/10 text-destructive cursor-default";
                    } else {
                      optionClass += " border-muted text-muted-foreground cursor-default";
                    }
                  }

                  return (
                    <button
                      type="button"
                      key={oIndex}
                      disabled={showResults}
                      aria-pressed={isSelected}
                      className={optionClass}
                      onClick={() => handleSelect(qIndex, option)}
                    >
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {String.fromCharCode(65 + oIndex)}.
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}

                {/* Per-question AI feedback */}
                {showResults && displayAnalysis?.questionFeedback?.[qIndex] && (
                  <p className="text-xs text-muted-foreground mt-2 px-1 italic">
                    💡 {displayAnalysis.questionFeedback[qIndex]}
                  </p>
                )}

                {/* Show correct answer hint when wrong */}
                {showResults && isWrong && (
                  <p className="text-xs text-muted-foreground mt-1 px-1">
                    Correct answer:{" "}
                    <span className="text-green-600 font-medium">{question.correctAnswer}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit Button */}
      {!alreadyAttempted && !submitted && (
        <div className="mt-8">
          <Separator className="mb-6" />
          <Button
            size="lg"
            className="w-full"
            disabled={!allAnswered}
            onClick={handleSubmit}
          >
            {allAnswered
              ? "Submit & Analyze with AI"
              : `Answer all questions (${Object.keys(answers).length}/${questions.length})`}
          </Button>
        </div>
      )}
    </ShowView>
  );
};

export default QuizzesShow;