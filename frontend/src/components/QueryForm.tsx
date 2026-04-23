import { Modal, Form, Input, Switch, DatePicker } from "antd";
import { QueryFormData } from "../types";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  initialValues?: QueryFormData & { id?: number };
  onOk: (values: QueryFormData) => void;
  onCancel: () => void;
}

const QueryForm = ({ open, initialValues, onOk, onCancel }: Props) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    onOk({
      name: values.name,
      is_active: values.is_active,
      deadline: values.deadline.toISOString(),
    });
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      title={initialValues?.id ? "Редактировать запрос" : "Новый запрос"}
      onOk={handleOk}
      onCancel={() => {
        onCancel();
        form.resetFields();
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: initialValues?.name,
          is_active: initialValues?.is_active ?? true,
          deadline: initialValues?.deadline ? dayjs(initialValues.deadline) : dayjs().add(7, "day"),
        }}
      >
        <Form.Item name="name" label="Название" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="is_active" label="Активен" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="deadline" label="Дедлайн" rules={[{ required: true }]}>
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QueryForm;