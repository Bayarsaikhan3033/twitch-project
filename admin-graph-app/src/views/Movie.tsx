import React, { useEffect, useState } from 'react'
import { useLazyReadCypher, useLazyWriteCypher } from 'use-neo4j'
import { int } from 'neo4j-driver'
import { Container, Dimmer, Segment, Loader, Header, Form, Button, Message } from 'semantic-ui-react'


function EditMovie({ movie }) {
    const [ error, setError ] = useState<Error>()
    const [ confirmation, setConfirmation ] = useState<string>()
    const [ title, setTitle ] = useState(movie.properties.title)
    const [ plot, setPlot ] = useState(movie.properties.plot)

    const [ updateMovie ] = useLazyWriteCypher(`MATCH (m:Movie) WHERE id(m) = $id SET m += $updates, m.updatedAt = datetime() RETURN m.updatedAt as updatedAt`)

    const handleSubmit = e => {
        e.preventDefault()

        updateMovie({ id: movie.identity, updates: { title, plot } })
            .then(res => {
                res && setConfirmation(`Node updated at ${res.records[0].get('updatedAt').toString()}`)
            })
            .catch(e => setError(e))
    }

    return (
        <Form>
            {confirmation && <Message positive>{confirmation}</Message>}
            {error && <Message negative>{error.message}</Message>}

            <Form.Field>
                <label htmlFor="title">Title</label>
                <input id="title" value={title} onChange={(e => setTitle(e.target.value))} />
            </Form.Field>
            <Form.Field>
                <label htmlFor="plot">Plot</label>
                <textarea id="plot" value={plot} onChange={(e => setPlot(e.target.value))} />
            </Form.Field>
            <Button primary onClick={handleSubmit}>Submit</Button>
        </Form>
    )
}

export default function Movie({ match }) {
    const { id } = match.params
    const [ getMovie, { loading, first } ] = useLazyReadCypher(
        'MATCH (m:Movie) WHERE id(m) = $id RETURN m'
    )

    useEffect(() => {
        getMovie({ id: int(id) })
        // eslint-disable-next-line
    }, [ id ])


    if (loading) {
        return (
            <Segment style={{ height: 500 }}>
                <Dimmer active>
                    <Loader />
                </Dimmer>
            </Segment>
        )
    }

    const movie = first?.get('m')

    if ( !movie ) {
        return (
            <Message negative>Movie with ID {match.params.id} not found...</Message>
        )
    }

    return (
        <Container>
            <Header>{movie.properties.title}</Header>
            <EditMovie movie={movie} />
        </Container>
    )
}