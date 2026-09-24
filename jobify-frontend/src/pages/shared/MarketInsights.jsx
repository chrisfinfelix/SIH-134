import React, { useMemo, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  NumberInput,
  NumberInputField,
  Progress,
  Select,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tab,
  Table,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageShell from "../../components/layout/PageShell";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import { useAuth } from "../../context/AuthContext";
import useAIStatus from "../../hooks/useAIStatus";
import api from "../../api/axios";

// Validated categorical pair (lightness band, CVD separation, 3:1 contrast on white)
const OBSERVED_COLOR = "#2F6FB5";
const FORECAST_COLOR = "#C75300";

const METHOD_LABELS = {
  lightgbm_global: "Global LightGBM model",
  prophet_fallback: "Prophet (cold-start series)",
  hybrid: "LightGBM + Prophet (mixed history)",
  insufficient_data: "Insufficient data",
};

const FEATURE_LABELS = {
  enrollment_capacity_ratio: "Enrolment vs seat capacity",
  placement_rate: "Placement rate",
  trend_slope: "Demand trend slope",
  sector_growth_pct: "Sector growth",
  rule_heuristic: "Rule-based estimate",
};

const formatMonth = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

const errorMessage = (error) => error?.response?.data?.message || error?.message || "Request failed";

const Panel = ({ title, subtitle, children, action }) => (
  <Box bg="white" borderWidth="1px" borderColor="#E2E8F0" borderRadius="md" p={{ base: 4, md: 5 }} boxShadow="sm">
    <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3} mb={4} direction={{ base: "column", md: "row" }}>
      <Box>
        <Heading size="sm" color="text.primary">
          {title}
        </Heading>
        {subtitle && (
          <Text fontSize="xs" color="text.muted" mt={0.5}>
            {subtitle}
          </Text>
        )}
      </Box>
      {action}
    </Flex>
    {children}
  </Box>
);

const QueryError = ({ error }) => (
  <Alert status="warning" borderRadius="md" fontSize="sm">
    <AlertIcon />
    {errorMessage(error)}
  </Alert>
);

// ─── Demand forecast ────────────────────────────────────────────────────────

const ForecastTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <Box bg="white" p={3} borderRadius="md" borderWidth="1px" borderColor="#E2E8F0" boxShadow="md" fontSize="xs">
      <Text fontWeight="700" color="text.primary" mb={1}>
        {formatMonth(label)}
      </Text>
      {row.observed != null && (
        <HStack spacing={2}>
          <Box w="10px" h="2px" bg={OBSERVED_COLOR} />
          <Text color="text.secondary">
            Observed: <strong>{Math.round(row.observed)}</strong> openings
          </Text>
        </HStack>
      )}
      {row.forecast != null && (
        <>
          <HStack spacing={2}>
            <Box w="10px" h="2px" bg={FORECAST_COLOR} />
            <Text color="text.secondary">
              Forecast: <strong>{Math.round(row.forecast)}</strong> openings
            </Text>
          </HStack>
          {row.band && (
            <Text color="text.muted" pl={4}>
              Range {Math.round(row.band[0])}–{Math.round(row.band[1])}
            </Text>
          )}
        </>
      )}
    </Box>
  );
};

const DemandForecastPanel = ({ options }) => {
  const series = options.forecast_series;
  const roles = useMemo(() => [...new Set(series.map((s) => s.role_title))].sort(), [series]);
  const [role, setRole] = useState(roles[0] || "");
  const skillsForRole = useMemo(
    () => [...new Set(series.filter((s) => s.role_title === role).map((s) => s.skill))].sort(),
    [series, role]
  );
  const [skill, setSkill] = useState("");
  const locationsForSelection = useMemo(
    () =>
      [...new Set(series.filter((s) => s.role_title === role && (!skill || s.skill === skill)).map((s) => s.location))].sort(),
    [series, role, skill]
  );
  const [location, setLocation] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["insights", "forecast", role, skill, location],
    queryFn: async () =>
      (await api.get("/insights/forecast", { params: { role, skill: skill || undefined, location: location || undefined } })).data
        .data,
    enabled: !!role,
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    const history = data.history || [];
    const rows = history.map((h) => ({ month: h.month, observed: h.openings }));
    // Bridge the last observed point into the forecast line so the two segments connect
    if (rows.length && data.forecast.length) {
      const last = rows[rows.length - 1];
      last.forecast = last.observed;
      last.band = [last.observed, last.observed];
    }
    data.forecast.forEach((f) =>
      rows.push({ month: f.month, forecast: f.predicted_openings, band: [f.lower_bound, f.upper_bound] })
    );
    return rows;
  }, [data]);

  const lastObserved = data?.history?.at(-1)?.openings;
  const nextForecast = data?.forecast?.[0]?.predicted_openings;
  const horizonForecast = data?.forecast?.at(-1)?.predicted_openings;
  const changePct =
    lastObserved > 0 && horizonForecast != null ? Math.round(((horizonForecast - lastObserved) / lastObserved) * 100) : null;

  return (
    <Panel
      title="Demand Forecast"
      subtitle="Monthly job openings — last 12 months observed, next 6 months forecast by the global LightGBM model"
      action={data && <Badge colorScheme="purple">{METHOD_LABELS[data.method] || data.method}</Badge>}
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={5}>
        <FormControl>
          <FormLabel fontSize="xs" fontWeight="700">
            Occupation
          </FormLabel>
          <Select
            size="sm"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setSkill("");
              setLocation("");
            }}
          >
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" fontWeight="700">
            Skill
          </FormLabel>
          <Select
            size="sm"
            value={skill}
            onChange={(e) => {
              setSkill(e.target.value);
              setLocation("");
            }}
          >
            <option value="">All skills for this role</option>
            {skillsForRole.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" fontWeight="700">
            District
          </FormLabel>
          <Select size="sm" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">All districts</option>
            {locationsForSelection.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </Select>
        </FormControl>
      </SimpleGrid>

      {isLoading && <LoadingSpinner message="Running demand forecast…" />}
      {isError && <QueryError error={error} />}
      {data && data.method === "insufficient_data" && (
        <EmptyState title="Not enough history" description="No demand history exists for this combination yet." />
      )}
      {data && data.method !== "insufficient_data" && (
        <>
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} mb={4}>
            <Stat p={3} bg="#F8FAFC" borderRadius="md">
              <StatLabel fontSize="xs" color="text.secondary">Latest month (observed)</StatLabel>
              <StatNumber fontSize="xl">{lastObserved != null ? Math.round(lastObserved) : "—"}</StatNumber>
              <StatHelpText fontSize="2xs" mb={0}>openings</StatHelpText>
            </Stat>
            <Stat p={3} bg="#F8FAFC" borderRadius="md">
              <StatLabel fontSize="xs" color="text.secondary">Next month (forecast)</StatLabel>
              <StatNumber fontSize="xl">{nextForecast != null ? Math.round(nextForecast) : "—"}</StatNumber>
              <StatHelpText fontSize="2xs" mb={0}>openings</StatHelpText>
            </Stat>
            <Stat p={3} bg="#F8FAFC" borderRadius="md">
              <StatLabel fontSize="xs" color="text.secondary">6-month outlook</StatLabel>
              <StatNumber fontSize="xl">{changePct != null ? `${changePct > 0 ? "+" : ""}${changePct}%` : "—"}</StatNumber>
              <StatHelpText fontSize="2xs" mb={0}>vs latest observed</StatHelpText>
            </Stat>
          </SimpleGrid>

          <Box h={{ base: "260px", md: "320px" }} role="img" aria-label="Line chart of observed and forecast job openings">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="#EDF2F7" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  fontSize={11}
                  tick={{ fill: "#718096" }}
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                  minTickGap={16}
                />
                <YAxis fontSize={11} tick={{ fill: "#718096" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ForecastTooltip />} />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: "#4A5568" }} />
                <Area
                  dataKey="band"
                  name="Forecast range"
                  stroke="none"
                  fill={FORECAST_COLOR}
                  fillOpacity={0.12}
                  isAnimationActive={false}
                  legendType="square"
                />
                <Line dataKey="observed" name="Observed" stroke={OBSERVED_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line
                  dataKey="forecast"
                  name="Forecast"
                  stroke={FORECAST_COLOR}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}
    </Panel>
  );
};

// ─── Emerging trends ────────────────────────────────────────────────────────

const TrendsPanel = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["insights", "trends"],
    queryFn: async () => (await api.get("/insights/trends")).data.data,
    staleTime: 10 * 60 * 1000,
  });

  const topics = data?.topics || [];
  const maxDocs = Math.max(1, ...topics.map((t) => t.doc_count));

  return (
    <Panel
      title="Emerging Skill Topics"
      subtitle="BERTopic clusters over job-posting text. Growth compares the most recent third of postings with the earlier period."
    >
      {isLoading && <LoadingSpinner message="Clustering job postings with BERTopic (first run can take ~30s)…" />}
      {isError && <QueryError error={error} />}
      {data && topics.length === 0 && <EmptyState title="No topics yet" description="Not enough postings to form clusters." />}
      {topics.length > 0 && (
        <Box overflowX="auto">
          <Table size="sm" minW="640px">
            <Thead>
              <Tr>
                <Th>Topic keywords</Th>
                <Th isNumeric>Postings</Th>
                <Th isNumeric>Growth</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {topics.map((t) => (
                <Tr key={t.topic_id}>
                  <Td>
                    <Wrap spacing={1}>
                      {t.top_terms.slice(0, 5).map((term) => (
                        <WrapItem key={term}>
                          <Badge variant="subtle" colorScheme="gray" textTransform="none" fontWeight="500">
                            {term}
                          </Badge>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Td>
                  <Td isNumeric>
                    <Flex align="center" justify="flex-end" gap={2}>
                      <Progress value={(t.doc_count / maxDocs) * 100} size="xs" w="60px" colorScheme="blue" borderRadius="full" />
                      <Text minW="32px">{t.doc_count}</Text>
                    </Flex>
                  </Td>
                  <Td isNumeric fontWeight="600" color={t.growth_pct >= 0 ? "green.600" : "red.600"}>
                    {t.growth_pct >= 0 ? "▲" : "▼"} {Math.abs(t.growth_pct)}%
                  </Td>
                  <Td>
                    {t.is_new_topic_flag ? (
                      <Badge colorScheme="purple">New topic — needs review</Badge>
                    ) : t.growth_pct >= 40 ? (
                      <Badge colorScheme="green">Fast growing</Badge>
                    ) : t.growth_pct < 0 ? (
                      <Badge colorScheme="orange">Cooling</Badge>
                    ) : (
                      <Badge colorScheme="gray">Stable</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Panel>
  );
};

// ─── Oversupply risk ────────────────────────────────────────────────────────

const OversupplyPanel = ({ options }) => {
  const [courseId, setCourseId] = useState(options.courses[0]?.course_id || "");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["insights", "oversupply", courseId],
    queryFn: async () => (await api.get(`/insights/oversupply/${encodeURIComponent(courseId)}`)).data.data,
    enabled: !!courseId,
  });

  const probPct = data ? Math.round(data.oversupply_probability * 100) : 0;
  const maxShap = Math.max(0.0001, ...(data?.top_reasons || []).map((r) => Math.abs(r.shap_value)));

  return (
    <Panel
      title="Oversupply Risk"
      subtitle="LightGBM classifier (weak-labelled from enrolment, placement and demand-trend rules) with SHAP explanations"
    >
      <FormControl mb={5} maxW="lg">
        <FormLabel fontSize="xs" fontWeight="700">
          Course
        </FormLabel>
        <Select size="sm" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {options.courses.map((c) => (
            <option key={c.course_id} value={c.course_id}>
              {c.course_id} · {c.course_name} ({c.district})
            </option>
          ))}
        </Select>
      </FormControl>

      {isLoading && <LoadingSpinner message="Scoring oversupply risk…" />}
      {isError && <QueryError error={error} />}
      {data && (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box p={4} bg="#F8FAFC" borderRadius="md">
            <Text fontSize="xs" fontWeight="700" color="text.secondary" textTransform="uppercase" letterSpacing="wide">
              Oversupply probability
            </Text>
            <Text fontSize="4xl" fontWeight="800" color="text.primary" lineHeight="1.1" mt={1}>
              {probPct}%
            </Text>
            <Progress
              value={probPct}
              size="sm"
              borderRadius="full"
              colorScheme={probPct >= 50 ? "red" : probPct >= 25 ? "orange" : "green"}
              mt={3}
            />
            <Badge mt={3} colorScheme={data.label === "oversupplied" ? "red" : "green"}>
              {data.label === "oversupplied" ? "Oversupplied — review intake" : "Balanced supply"}
            </Badge>
          </Box>
          <Box>
            <Text fontSize="xs" fontWeight="700" color="text.secondary" mb={2}>
              WHY — top SHAP contributions
            </Text>
            <VStack align="stretch" spacing={3}>
              {data.top_reasons.map((r) => (
                <Box key={r.feature}>
                  <Flex justify="space-between" fontSize="sm">
                    <Text color="text.primary">{FEATURE_LABELS[r.feature] || r.feature}</Text>
                    <Text color="text.secondary" fontSize="xs">
                      {r.shap_value > 0 ? "raises risk" : "lowers risk"}
                    </Text>
                  </Flex>
                  <Progress
                    value={(Math.abs(r.shap_value) / maxShap) * 100}
                    size="xs"
                    borderRadius="full"
                    colorScheme={r.shap_value > 0 ? "red" : "green"}
                    mt={1}
                  />
                </Box>
              ))}
            </VStack>
          </Box>
        </SimpleGrid>
      )}
    </Panel>
  );
};

// ─── Curriculum ranking ─────────────────────────────────────────────────────

const CurriculumPanel = ({ options }) => {
  const [role, setRole] = useState(options.roles[0] || "");
  const [district, setDistrict] = useState("");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["insights", "curriculum", role, district],
    queryFn: async () =>
      (await api.get("/insights/curriculum", { params: { role, location: district || undefined } })).data.data,
    enabled: !!role,
  });

  return (
    <Panel
      title="Curriculum Recommendation Ranking"
      subtitle="LambdaRank model ordering courses by skill overlap, forecast demand and seat headroom for a target occupation"
    >
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={5}>
        <FormControl>
          <FormLabel fontSize="xs" fontWeight="700">
            Target occupation
          </FormLabel>
          <Select size="sm" value={role} onChange={(e) => setRole(e.target.value)}>
            {options.roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" fontWeight="700">
            District
          </FormLabel>
          <Select size="sm" value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">All districts</option>
            {options.districts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </FormControl>
      </SimpleGrid>

      {isLoading && <LoadingSpinner message="Ranking courses…" />}
      {isError && <QueryError error={error} />}
      {data && data.recommendations.length === 0 && <EmptyState title="No courses found" />}
      {data && data.recommendations.length > 0 && (
        <VStack align="stretch" spacing={2}>
          {data.recommendations.map((rec, idx) => (
            <Flex key={rec.course_id || idx} p={3} borderWidth="1px" borderColor="#E2E8F0" borderRadius="md" gap={3} align="center">
              <Flex
                w={8}
                h={8}
                flexShrink={0}
                borderRadius="full"
                bg={idx === 0 ? "brand.500" : "brand.50"}
                color={idx === 0 ? "white" : "brand.500"}
                align="center"
                justify="center"
                fontWeight="700"
                fontSize="sm"
              >
                {idx + 1}
              </Flex>
              <Box flex="1" minW={0}>
                <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                  {rec.course_name}
                </Text>
                <Text fontSize="xs" color="text.muted" noOfLines={2}>
                  {rec.course_id} · {rec.rationale}
                </Text>
              </Box>
            </Flex>
          ))}
        </VStack>
      )}
    </Panel>
  );
};

// ─── District training plan optimiser ───────────────────────────────────────

const formatINR = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const DistrictPlanPanel = ({ options }) => {
  const [district, setDistrict] = useState(options.districts[0] || "");
  const [budget, setBudget] = useState("1000000");
  const [maxCourses, setMaxCourses] = useState("5");

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.post("/insights/district-plan", {
          district,
          budget: Number(budget),
          maxCourses: Number(maxCourses),
        })
      ).data.data,
  });

  const plan = mutation.data;
  const totalSeats = plan?.plan.reduce((sum, p) => sum + p.seats_funded, 0) || 0;

  return (
    <Panel
      title="District Training Plan Optimiser"
      subtitle="Linear program (PuLP/CBC) that allocates funded seats to maximise demand-weighted capacity within budget"
    >
      <Flex
        as="form"
        gap={3}
        mb={5}
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "flex-end" }}
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <FormControl>
          <FormLabel fontSize="xs" fontWeight="700">
            District
          </FormLabel>
          <Select size="sm" value={district} onChange={(e) => setDistrict(e.target.value)}>
            {options.districts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" fontWeight="700">
            Budget (₹)
          </FormLabel>
          <NumberInput size="sm" min={10000} step={100000} value={budget} onChange={(v) => setBudget(v)}>
            <NumberInputField />
          </NumberInput>
        </FormControl>
        <FormControl maxW={{ md: "140px" }}>
          <FormLabel fontSize="xs" fontWeight="700">
            Max courses
          </FormLabel>
          <NumberInput size="sm" min={1} max={50} value={maxCourses} onChange={(v) => setMaxCourses(v)}>
            <NumberInputField />
          </NumberInput>
        </FormControl>
        <Button type="submit" size="sm" colorScheme="brand" px={6} isLoading={mutation.isPending} flexShrink={0}>
          Optimise plan
        </Button>
      </Flex>

      {mutation.isError && <QueryError error={mutation.error} />}
      {plan && plan.plan.length === 0 && (
        <EmptyState title="No plan generated" description={`Solver status: ${plan.status}. Try another district or a larger budget.`} />
      )}
      {plan && plan.plan.length > 0 && (
        <>
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} mb={4}>
            <Stat p={3} bg="#F8FAFC" borderRadius="md">
              <StatLabel fontSize="xs" color="text.secondary">Seats funded</StatLabel>
              <StatNumber fontSize="xl">{totalSeats.toLocaleString("en-IN")}</StatNumber>
            </Stat>
            <Stat p={3} bg="#F8FAFC" borderRadius="md">
              <StatLabel fontSize="xs" color="text.secondary">Budget used</StatLabel>
              <StatNumber fontSize="xl">{formatINR(plan.total_cost)}</StatNumber>
              <StatHelpText fontSize="2xs" mb={0}>
                of {formatINR(Number(budget))}
              </StatHelpText>
            </Stat>
            <Stat p={3} bg="#F8FAFC" borderRadius="md">
              <StatLabel fontSize="xs" color="text.secondary">Solver status</StatLabel>
              <StatNumber fontSize="xl">{plan.status}</StatNumber>
            </Stat>
          </SimpleGrid>
          <Box overflowX="auto">
            <Table size="sm" minW="560px">
              <Thead>
                <Tr>
                  <Th>Course</Th>
                  <Th isNumeric>Seats</Th>
                  <Th isNumeric>Cost</Th>
                  <Th>Demand score</Th>
                </Tr>
              </Thead>
              <Tbody>
                {plan.plan.map((p) => (
                  <Tr key={p.course_id}>
                    <Td>
                      <Text fontWeight="600">{p.course_name}</Text>
                      <Text fontSize="2xs" color="text.muted">
                        {p.course_id}
                      </Text>
                    </Td>
                    <Td isNumeric>{p.seats_funded}</Td>
                    <Td isNumeric>{formatINR(p.cost)}</Td>
                    <Td>
                      <Flex align="center" gap={2}>
                        <Progress value={p.expected_demand_score * 100} size="xs" w="80px" borderRadius="full" colorScheme="blue" />
                        <Text fontSize="xs">{p.expected_demand_score.toFixed(2)}</Text>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
          <Text fontSize="2xs" color="text.muted" mt={3}>
            Assumes a flat cost of ₹10,000 per seat until per-course cost data is available.
          </Text>
        </>
      )}
    </Panel>
  );
};

// ─── Page ───────────────────────────────────────────────────────────────────

const MarketInsights = () => {
  const { user } = useAuth();
  const { data: status, isLoading: statusLoading } = useAIStatus();
  const aiOnline = status?.available;

  const { data: options, isLoading: optionsLoading, isError, error } = useQuery({
    queryKey: ["insights", "options"],
    queryFn: async () => (await api.get("/insights/options")).data.data,
    enabled: !!aiOnline,
    staleTime: 30 * 60 * 1000,
  });

  const role = user?.role;
  const tabs = [
    { key: "forecast", label: "Demand Forecast", render: () => <DemandForecastPanel options={options} /> },
    { key: "trends", label: "Emerging Trends", render: () => <TrendsPanel /> },
    ...(role === "admin" || role === "institute"
      ? [
          { key: "oversupply", label: "Oversupply Risk", render: () => <OversupplyPanel options={options} /> },
          { key: "curriculum", label: "Curriculum Ranking", render: () => <CurriculumPanel options={options} /> },
        ]
      : []),
    ...(role === "admin"
      ? [{ key: "district", label: "District Plan Optimiser", render: () => <DistrictPlanPanel options={options} /> }]
      : []),
  ];

  return (
    <PageShell
      role={null}
      title="AI Market Intelligence"
      subtitle="Forecasts, emerging-skill detection and planning models from the Jobify ML service"
      breadcrumbItems={[{ label: "AI Market Intelligence" }]}
    >
      <Alert status="info" variant="left-accent" borderRadius="md" mb={6} fontSize="sm">
        <AlertIcon />
        <Box>
          <AlertTitle fontSize="sm">Prototype models</AlertTitle>
          <AlertDescription fontSize="xs">
            These models are trained on a seeded synthetic labour-market dataset (16 districts, 40 NCO occupations, 30 months).
            Figures illustrate the pipeline and will reflect real demand once live NCS/placement feeds are connected.
          </AlertDescription>
        </Box>
      </Alert>

      {statusLoading && <LoadingSpinner message="Connecting to the AI engine…" />}
      {!statusLoading && !aiOnline && (
        <EmptyState
          title="AI engine offline"
          description="The ML service isn't reachable right now. Everything else in the portal keeps working — start ml-service (uvicorn app.main:app --port 8000) to enable these insights."
        />
      )}
      {aiOnline && optionsLoading && <LoadingSpinner message="Loading model inputs…" />}
      {aiOnline && isError && <QueryError error={error} />}
      {aiOnline && options && (
        <Tabs variant="enclosed-colored" colorScheme="brand" isLazy>
          <TabList overflowX="auto" overflowY="hidden" whiteSpace="nowrap" pb="1px">
            {tabs.map((t) => (
              <Tab key={t.key} fontSize="sm" fontWeight="600" flexShrink={0}>
                {t.label}
              </Tab>
            ))}
          </TabList>
          <TabPanels>
            {tabs.map((t) => (
              <TabPanel key={t.key} px={0} pt={4}>
                {t.render()}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      )}
    </PageShell>
  );
};

export default MarketInsights;
