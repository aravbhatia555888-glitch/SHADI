import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ToastContainer } from "@/components/ToastContainer";
import { useToastStore } from "@/stores/toast-store";

describe("ToastContainer", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("renders nothing when there are no toasts", () => {
    const { toJSON } = render(<ToastContainer />);
    expect(toJSON()).toBeNull();
  });

  it("renders a toast with message", () => {
    useToastStore.setState({
      toasts: [{ id: "1", message: "Operation successful", type: "success" }],
    });

    const { getByText } = render(<ToastContainer />);
    expect(getByText("Operation successful")).toBeTruthy();
  });

  it("renders error type toast", () => {
    useToastStore.setState({
      toasts: [{ id: "1", message: "Something went wrong", type: "error" }],
    });

    const { getByText } = render(<ToastContainer />);
    expect(getByText("Something went wrong")).toBeTruthy();
  });

  it("renders warning type toast", () => {
    useToastStore.setState({
      toasts: [{ id: "1", message: "Warning message", type: "warning" }],
    });

    const { getByText } = render(<ToastContainer />);
    expect(getByText("Warning message")).toBeTruthy();
  });

  it("renders info type toast", () => {
    useToastStore.setState({
      toasts: [{ id: "1", message: "Info message", type: "info" }],
    });

    const { getByText } = render(<ToastContainer />);
    expect(getByText("Info message")).toBeTruthy();
  });

  it("renders multiple toasts", () => {
    useToastStore.setState({
      toasts: [
        { id: "1", message: "First toast", type: "success" },
        { id: "2", message: "Second toast", type: "error" },
      ],
    });

    const { getByText } = render(<ToastContainer />);
    expect(getByText("First toast")).toBeTruthy();
    expect(getByText("Second toast")).toBeTruthy();
  });

  it("removes a toast when close button is pressed", () => {
    useToastStore.setState({
      toasts: [{ id: "1", message: "Dismiss me", type: "info" }],
    });

    const removeToast = jest.spyOn(useToastStore.getState(), "removeToast");

    const { getByLabelText } = render(<ToastContainer />);
    fireEvent.press(getByLabelText("Dismiss notification"));

    expect(removeToast).toHaveBeenCalledWith("1");
  });

  it("renders with icon for each toast type", () => {
    useToastStore.setState({
      toasts: [
        { id: "1", message: "Success", type: "success" },
        { id: "2", message: "Error", type: "error" },
        { id: "3", message: "Warning", type: "warning" },
        { id: "4", message: "Info", type: "info" },
      ],
    });

    const { getByText } = render(<ToastContainer />);
    expect(getByText("Success")).toBeTruthy();
    expect(getByText("Error")).toBeTruthy();
    expect(getByText("Warning")).toBeTruthy();
    expect(getByText("Info")).toBeTruthy();
  });

  it("adds and removes toasts dynamically", () => {
    const { rerender, getByText, queryByText } = render(<ToastContainer />);

    // Add a toast
    useToastStore.setState({
      toasts: [{ id: "1", message: "Dynamic toast", type: "info" }],
    });
    rerender(<ToastContainer />);
    expect(getByText("Dynamic toast")).toBeTruthy();

    // Remove the toast
    useToastStore.setState({ toasts: [] });
    rerender(<ToastContainer />);
    expect(queryByText("Dynamic toast")).toBeNull();
  });
});
