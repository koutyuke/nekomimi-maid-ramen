import { Alert, Button, Container, Divider, Flex, Paper, SimpleGrid, Stack, Table, Text, Title } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import ja from "dayjs/locale/ja";
import { RefreshCw } from "lucide-react";

import { yen } from "../../../shared/lib";
import { ConnectingIndicator, ErrorAlert, LoadingNotice } from "../../../shared/ui";
import type { SalesSummaryState } from "../model/use-sales-summary";

export type SalesSummaryPageUIProps = {
  businessDate: string;
  summary: SalesSummaryState;
  realtimeConnected: boolean;
  onBusinessDateChange: (value: string) => void;
  onRetry: () => void;
};

export const SalesSummaryPageUI = ({
  businessDate,
  summary,
  realtimeConnected,
  onBusinessDateChange,
  onRetry,
}: SalesSummaryPageUIProps) => (
  <Container size="md" py="lg">
    <Stack>
      <Flex gap="xs" align="center">
        <Title order={1}>売上集計</Title>
        <Flex flex={1} align="center" justify="end">
          {!realtimeConnected && (summary.status === "pending" || summary.status === "success") && (
            <ConnectingIndicator />
          )}
        </Flex>
        <Button aria-label="再読み込み" variant="light" onClick={onRetry} h={44} w={44} p={0}>
          <RefreshCw size={20} />
        </Button>
      </Flex>
      <Text c="dimmed" size="sm">
        取り消していない確定注文を、確定時の価格で集計します。紙運用中の注文は含みません。
      </Text>

      <DatePickerInput
        label="営業日"
        locale={ja.name}
        valueFormat="YYYY年M月D日"
        value={businessDate}
        onChange={(value) => {
          if (value) {
            onBusinessDateChange(value);
          }
        }}
      />
      <Divider />

      {summary.status === "pending" && <LoadingNotice>売上を読み込んでいます</LoadingNotice>}
      {summary.status === "error" && (
        <ErrorAlert>最新の売上を取得できません。権限と通信状況を確認して再読み込みしてください。</ErrorAlert>
      )}
      {summary.status === "denied" && (
        <Alert color="yellow" role="alert">
          売上へのアクセスが拒否されました。ログイン状態と管理者権限を確認してください。
        </Alert>
      )}
      {summary.status === "success" && (
        <>
          <SimpleGrid cols={2}>
            <Paper withBorder p="md">
              <Text c="dimmed" size="sm">
                売上合計
              </Text>
              <Text fw={700} fz={28}>
                {yen(summary.data.totalAmount)}
              </Text>
            </Paper>
            <Paper withBorder p="md">
              <Text c="dimmed" size="sm">
                注文件数
              </Text>
              <Text fw={700} fz={28}>
                {summary.data.orderCount}件
              </Text>
            </Paper>
          </SimpleGrid>
          <Table aria-label="商品別の売上" highlightOnHover verticalSpacing="sm" withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>商品</Table.Th>
                <Table.Th ta="right">販売数</Table.Th>
                <Table.Th ta="right">売上</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {summary.data.items.map((item) => (
                <Table.Tr key={item.menuItemId}>
                  <Table.Td fw={500}>{item.name}</Table.Td>
                  <Table.Td ta="right">{item.quantity}個</Table.Td>
                  <Table.Td ta="right">{yen(item.amount)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>
      )}
    </Stack>
  </Container>
);
