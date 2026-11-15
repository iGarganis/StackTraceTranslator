// Example trace loaded by the "Try a sample trace" button in the empty state.
export const SAMPLE_TRACE = `Traceback (most recent call last):
  File "/srv/api/orders.py", line 42, in create_order
    total = sum(item["price"] * item["qty"] for item in cart)
  File "/srv/api/orders.py", line 42, in <genexpr>
    total = sum(item["price"] * item["qty"] for item in cart)
KeyError: 'price'`;

export const STACK_TRACE_INPUT_ID = "stack-trace-input";
