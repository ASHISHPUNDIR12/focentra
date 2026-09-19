"use client";

import { SubmitEvent, useState } from "react";

const CreateRoom = () => {
    const [title, setTitle] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState("");

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setIsSubmitting(true);

        try {
            const response = await fetch("http://localhost:3001/v1/rooms", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Unable to create room");
                return;
            }

            setTitle("");
        } catch (error) {
            console.error(error);

            setError("Unable to reach server");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col border text-center">
            <h1>Create room</h1>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 text-center"
            >
                <label>Title</label>

                <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="border text-center"
                    name="title"
                    placeholder="title"
                />

                <button disabled={isSubmitting} type="submit">
                    {isSubmitting ? "Creating..." : "Create room"}
                </button>

                {error && <p>{error}</p>}
            </form>
        </div>
    );
};

export default CreateRoom;
