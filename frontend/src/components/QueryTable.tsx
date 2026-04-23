import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Group,
  Badge,
  Text,
  Modal,
  TextInput,
  Switch,
  Checkbox,
  ActionIcon,
  Popover,
  Stack,
  Pagination,
  Box,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { IconEdit, IconTrash, IconFilter, IconPlus } from "@tabler/icons-react";
import { SearchQuery, QueryFormData } from "../types";
import { fetchQueries, deleteQuery, batchDelete, createQuery, updateQuery } from "../api/queries";
import dayjs from "dayjs";

const PAGE_SIZE = 20;

const QueryTable = () => {
  const [data, setData] = useState<SearchQuery[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formDeadline, setFormDeadline] = useState<Date>(new Date());
  const [formActive, setFormActive] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [openedFilter, setOpenedFilter] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = async () => {
    setLoading(true);
    const res = await fetchQueries(
      page,
      PAGE_SIZE,
      sortBy || undefined,
      sortBy ? (sortOrder === "desc" ? "descend" : "ascend") : undefined
    );
    setData(res.items);
    setTotal(res.total);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [page, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === data.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.map((d) => d.id)));
    }
  };

  const handleDelete = async (id: number) => {
    await deleteQuery(id);
    load();
  };

  const handleBatchDelete = async () => {
    await batchDelete(Array.from(selected));
    setSelected(new Set());
    load();
  };

  const openCreate = () => {
    setEditingId(null);
    setFormName("");
    setFormDeadline(dayjs().add(7, "day").toDate());
    setFormActive(true);
    setModalOpen(true);
  };

  const openEdit = (q: SearchQuery) => {
    setEditingId(q.id);
    setFormName(q.name);
    setFormDeadline(new Date(q.deadline));
    setFormActive(q.is_active);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload: QueryFormData = {
      name: formName,
      is_active: formActive,
      deadline: formDeadline.toISOString(),
    };
    if (editingId) {
      await updateQuery(editingId, payload);
    } else {
      await createQuery(payload);
    }
    setModalOpen(false);
    load();
  };

  const filteredData = data.filter((item) => {
    return Object.entries(filters).every(([key, val]) => {
      if (!val) return true;
      const itemVal = String(item[key as keyof SearchQuery] ?? "").toLowerCase();
      return itemVal.includes(val.toLowerCase());
    });
  });

  const sortIndicator = (field: string) => {
    if (sortBy !== field) return "";
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  const renderFilterPopover = (field: keyof SearchQuery) => (
    <Popover
      opened={openedFilter === field}
      onChange={(open) => setOpenedFilter(open ? field : null)}
      position="bottom-end"
    >
      <Popover.Target>
        <ActionIcon
          variant="subtle"
          size="sm"
          color={filters[field] ? "blue" : "gray"}
          onClick={(e) => {
            e.stopPropagation();
            setOpenedFilter(openedFilter === field ? null : field);
          }}
        >
          <IconFilter size={14} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <TextInput
          placeholder="Фильтр..."
          value={filters[field] || ""}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, [field]: e.target.value }));
            setPage(1);
          }}
          autoFocus
        />
      </Popover.Dropdown>
    </Popover>
  );

  const rows = filteredData.map((row) => (
    <Table.Tr key={row.id} bg={row.is_expired ? "red.0" : undefined}>
      <Table.Td>
        <Checkbox
          checked={selected.has(row.id)}
          onChange={() => toggleSelect(row.id)}
        />
      </Table.Td>
      <Table.Td>{row.id}</Table.Td>
      <Table.Td maw={200}>
        <Text truncate>{row.name}</Text>
      </Table.Td>
      <Table.Td>{new Date(row.created_at).toLocaleDateString()}</Table.Td>
      <Table.Td>{new Date(row.updated_at).toLocaleDateString()}</Table.Td>
      <Table.Td>
        <Badge color={row.is_active ? "green" : "gray"} variant="light">
          {row.is_active ? "Активен" : "Не активен"}
        </Badge>
      </Table.Td>
      <Table.Td>{row.owner}</Table.Td>
      <Table.Td c={row.is_expired ? "red" : undefined} fw={row.is_expired ? 500 : undefined}>
        {new Date(row.deadline).toLocaleDateString()}
      </Table.Td>
      <Table.Td>{row.found_objects_count.toLocaleString()}</Table.Td>
      <Table.Td>
        <Group gap={4}>
          <ActionIcon variant="subtle" size="sm" onClick={() => openEdit(row)}>
            <IconEdit size={14} />
          </ActionIcon>
          <ActionIcon variant="subtle" size="sm" color="red" onClick={() => handleDelete(row.id)}>
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box p="md">
      <Group mb="md">
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Новый запрос
        </Button>
        {selected.size > 0 && (
          <Button color="red" onClick={handleBatchDelete}>
            Удалить выбранные ({selected.size})
          </Button>
        )}
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox
                checked={selected.size === data.length && data.length > 0}
                indeterminate={selected.size > 0 && selected.size < data.length}
                onChange={toggleAll}
              />
            </Table.Th>
            <Table.Th w={80}>
              <Group gap={4} wrap="nowrap">
                <Text span size="sm" fw={700} style={{ cursor: "pointer" }} onClick={() => handleSort("id")}>
                  ID{sortIndicator("id")}
                </Text>
                {renderFilterPopover("id")}
              </Group>
            </Table.Th>
            <Table.Th>
              <Group gap={4} wrap="nowrap">
                <Text span size="sm" fw={700} style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
                  Название{sortIndicator("name")}
                </Text>
                {renderFilterPopover("name")}
              </Group>
            </Table.Th>
            <Table.Th>
              <Text span size="sm" fw={700} style={{ cursor: "pointer" }} onClick={() => handleSort("created_at")}>
                Создан{sortIndicator("created_at")}
              </Text>
            </Table.Th>
            <Table.Th>
              <Text span size="sm" fw={700} style={{ cursor: "pointer" }} onClick={() => handleSort("updated_at")}>
                Изменён{sortIndicator("updated_at")}
              </Text>
            </Table.Th>
            <Table.Th>
              <Text span size="sm" fw={700} style={{ cursor: "pointer" }} onClick={() => handleSort("is_active")}>
                Статус{sortIndicator("is_active")}
              </Text>
            </Table.Th>
            <Table.Th>
              <Group gap={4} wrap="nowrap">
                <Text span size="sm" fw={700} style={{ cursor: "pointer" }} onClick={() => handleSort("owner")}>
                  Владелец{sortIndicator("owner")}
                </Text>
                {renderFilterPopover("owner")}
              </Group>
            </Table.Th>
            <Table.Th>
              <Text span size="sm" fw={700} style={{ cursor: "pointer" }} onClick={() => handleSort("deadline")}>
                Дедлайн{sortIndicator("deadline")}
              </Text>
            </Table.Th>
            <Table.Th>
              <Text span size="sm" fw={700} style={{ cursor: "pointer" }} onClick={() => handleSort("found_objects_count")}>
                Объектов{sortIndicator("found_objects_count")}
              </Text>
            </Table.Th>
            <Table.Th w={80}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Group justify="center" mt="md">
        <Pagination total={totalPages} value={page} onChange={setPage} />
      </Group>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Редактировать запрос" : "Новый запрос"}
      >
        <Stack>
          <TextInput
            label="Название"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <DateTimePicker
            label="Дедлайн"
            value={formDeadline}
            onChange={(v) => v && setFormDeadline(new Date(v as string))}
            required
            valueFormat="DD.MM.YYYY HH:mm"
          />
          <Switch
            label="Активен"
            checked={formActive}
            onChange={(e) => setFormActive(e.currentTarget.checked)}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default QueryTable;